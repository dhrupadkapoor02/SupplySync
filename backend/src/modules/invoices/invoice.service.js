import prisma from "../../config/prisma.js";
import {
  uploadInvoiceToCloudinary,
  extractTextFromFile,
} from "./ocr.service.js";
import { extractInvoiceData, calculateConfidenceScore } from "./llm.service.js";
import { matchProduct } from "./matching.service.js";

const CONFIDENCE_THRESHOLD = 90;

export async function processInvoice(fileBuffer, mimetype, brandId, adminId) {
  // Step 1: Find brand
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) throw new Error("BRAND_NOT_FOUND");

  // Step 2: Upload to Cloudinary
  const uploadResult = await uploadInvoiceToCloudinary(
    fileBuffer,
    mimetype,
    `${brand.name}_${Date.now()}`,
  );
  const fileUrl = uploadResult.secure_url;

  // Step 3: Create invoice record immediately
  const invoice = await prisma.invoice.create({
    data: {
      brandId,
      invoiceNumber: `PENDING_${Date.now()}`,
      invoiceDate: new Date(),
      supplierName: brand.name,
      fileUrl,
      status: "PROCESSING",
      processedById: adminId,
    },
  });

  try {
    // Step 4: OCR
    const rawOcrText = await extractTextFromFile(fileBuffer, mimetype);

    // Step 5: LLM extraction
    const extractedData = await extractInvoiceData(rawOcrText);

    // Step 7: Match products
    const matchedItems = await Promise.all(
      extractedData.items.map(async (item) => {
        const match = await matchProduct(item.name, brandId);
        return {
          rawProductName: item.name,
          matchedProductName: match.matchedProduct?.name || null,
          matchMethod: match.matchMethod,
          confidenceScore: match.confidence,
          quantity: item.quantity,
          purchasePrice: item.purchase_price,
          gstPercent: item.gst_percent,
          isNewProduct: match.matchMethod === "NEW",
          needsReview: match.confidence < 0.8 || match.matchMethod === "NEW",
          ...(match.matchedProduct
            ? { matchedProduct: { connect: { id: match.matchedProduct.id } } }
            : {}),
        };
      }),
    );

    // Step 6: Confidence scoring — factors in both extraction quality AND matching
    const baseConfidence = calculateConfidenceScore(extractedData);
    const newProductCount = matchedItems.filter((i) => i.isNewProduct).length;
    const newProductRatio = newProductCount / matchedItems.length;

    const confidence = {
      score:
        newProductRatio > 0.3
          ? Math.min(baseConfidence.score, 70)
          : baseConfidence.score,
      issues: [
        ...baseConfidence.issues,
        ...(newProductRatio > 0.3
          ? [
              `${newProductCount} of ${matchedItems.length} items are unmatched new products`,
            ]
          : []),
      ],
      requiresReview: baseConfidence.requiresReview || newProductRatio > 0.3,
    };

    // Step 8: Update invoice with results
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        invoiceNumber: extractedData.invoice_number || invoice.invoiceNumber,
        invoiceDate: extractedData.invoice_date
          ? new Date(extractedData.invoice_date)
          : new Date(),
        supplierName: extractedData.supplier_name || brand.name,
        rawOcrText,
        extractedJson: extractedData,
        overallConfidenceScore: confidence.score,
        status: confidence.requiresReview ? "NEEDS_REVIEW" : "CONFIRMED",
        totalAmount: extractedData.total_amount,
        gstAmount: extractedData.gst_amount,
        items: {
          create: matchedItems,
        },
      },
      include: { items: true },
    });

    return {
      invoice: updatedInvoice,
      confidence,
      requiresReview: confidence.requiresReview,
      summary: {
        totalItems: matchedItems.length,
        newProducts: matchedItems.filter((i) => i.isNewProduct).length,
        matchedProducts: matchedItems.filter((i) => !i.isNewProduct).length,
        itemsNeedingReview: matchedItems.filter((i) => i.needsReview).length,
      },
    };
  } catch (error) {
    // If processing fails, mark invoice as needing review
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { status: "NEEDS_REVIEW" },
    });
    throw error;
  }
}

export async function confirmInvoice(invoiceId, adminId) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  if (invoice.status === "CONFIRMED") throw new Error("ALREADY_CONFIRMED");

  return prisma.$transaction(async (tx) => {
    for (const item of invoice.items) {
      if (item.matchedProductId) {
        // Existing product — increment stock
        const product = await tx.product.findUnique({
          where: { id: item.matchedProductId },
        });

        const oldStock = product.currentStock;
        const newStock = oldStock + item.quantity;

        await tx.product.update({
          where: { id: item.matchedProductId },
          data: {
            currentStock: { increment: item.quantity },
            lastPurchasePrice: item.purchasePrice,
          },
        });

        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "STOCK_INCREMENTED",
            entityType: "Product",
            entityId: item.matchedProductId,
            oldValue: { stock: oldStock },
            newValue: { stock: newStock, source: `Invoice ${invoiceId}` },
          },
        });
      } else if (item.isNewProduct) {
        // Skip items with missing critical data
        if (!item.quantity || !item.purchasePrice) continue;

      
        // New product — create it automatically
        const sku = generateSKUFromName(item.rawProductName);

        const newProduct = await tx.product.create({
          data: {
            brandId: invoice.brandId,
            name: item.rawProductName,
            sku,
            currentStock: item.quantity,
            lowStockThreshold: 10,
            defaultSellingPrice: item.purchasePrice,
            lastPurchasePrice: item.purchasePrice,
            isAiGenerated: true,
            needsReview: true,
          },
        });

        // Link the invoice item to the newly created product
        await tx.invoiceItem.update({
          where: { id: item.id },
          data: { matchedProductId: newProduct.id },
        });

        await tx.auditLog.create({
          data: {
            userId: adminId,
            action: "PRODUCT_AUTO_CREATED",
            entityType: "Product",
            entityId: newProduct.id,
            newValue: {
              name: newProduct.name,
              stock: item.quantity,
              source: `Invoice ${invoiceId}`,
            },
          },
        });
      }
    }

    return tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: "CONFIRMED",
        processedById: adminId,
      },
      include: { items: true },
    });
  });
}

function generateSKUFromName(name) {
  const prefix = name
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 6)
    .toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `AI-${prefix}-${random}`;
}

export async function getInvoices(filters = {}) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.brandId) where.brandId = filters.brandId;

  return prisma.invoice.findMany({
    where,
    include: {
      brand: true,
      items: true,
      processedBy: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoiceById(id) {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      brand: true,
      items: {
        include: {
          matchedProduct: true,
        },
      },
      processedBy: {
        select: { id: true, name: true, phone: true },
      },
    },
  });

  if (!invoice) throw new Error("INVOICE_NOT_FOUND");
  return invoice;
}
