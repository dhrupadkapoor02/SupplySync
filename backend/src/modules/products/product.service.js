import prisma from "../../config/prisma.js";

function generateSKU(brandName, productName) {
  const brand = brandName.substring(0, 3).toUpperCase();
  const product = productName.substring(0, 3).toUpperCase();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${brand}-${product}-${random}`;
}

export async function createProduct(data) {
  const brand = await prisma.product.findUnique({
    where: { id: data.brandId },
  });

  if (!brand) {
    throw new Error("Brand_Not_Found");
  }

  const sku = data.sku || generateSKU(brand.name, data.name);

  const existing = await prisma.product.findUnique({ where: { sku } });

  if (existing) {
    throw new Error("SKU Exists");
  }

  return prisma.product.create({
    data: {
      brandId: data.brandId,
      name: data.name,
      variant: data.variant || null,
      sku,
      aliases: data.aliases || [],
      imageUrl: data.imageUrl || null,
      category: data.category || null,
      currentStock: data.currentStock || 0,
      lowStockThreshold: data.lowStockThreshold || 10,
      defaultSellingPrice: data.defaultSellingPrice,
      lastPurchasePrice: data.lastPurchasePrice || null,
    },
    include: { brand: true },
  });
}

export async function getProducts(filters = {}) {
  const where = {};

  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.category) where.category = filters.category;
  if (filters.needsReview) where.needsReview = true;

  if (filters.lowStock) {
    where.currentStock = {
      lte: prisma.product.fields.lowStockThreshold,
    };
  }
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
      { aliases: { has: filters.search } },
    ];
  }
  return prisma.product.findMany({
    where,
    include: { brand: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductById(id) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true },
  });
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  return product;
}

export async function updateProduct(id, data) {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new Error("Product Not Found");
  }
  return prisma.product.update({
    where: { id },
    data: {
      name: data.name ?? product.name,
      variant: data.variant ?? product.variant,
      imageUrl: data.imageUrl ?? product.imageUrl,
      category: data.category ?? product.category,
      defaultSellingPrice:
        data.defaultSellingPrice ?? product.defaultSellingPrice,
      lowStockThreshold: data.lowStockThreshold ?? product.lowStockThreshold,
      aliases: data.aliases ?? product.aliases,
      needsReview: data.needsReview ?? product.needsReview,
    },
    include: { brand: true },
  });
}

export async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    include: { brand: true },
    orderBy: { currentStock: 'asc' },
  });

  return products.filter(
    (p) => p.currentStock <= p.lowStockThreshold
  );
}

export async function setCustomPrice(userId, productId, customPrice) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  return prisma.userProductPrice.upsert({
    where: {
      userId_productId: { userId, productId },
    },
    update: { customPrice },
    create: { userId, productId, customPrice },
  });
}

export async function getProductsForRetailer(retailerId, filters = {}) {
  const where = { currentStock: { gt: 0 } };

  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.category) where.category = filters.category;

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { aliases: { has: filters.search } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      customPrices: {
        where: { userId: retailerId },
      },
    },
    orderBy: { name: 'asc' },
  });

  return products.map((product) => {
    const customPrice = product.customPrices[0]?.customPrice;
    return {
      ...product,
      displayPrice: customPrice ?? product.defaultSellingPrice,
      hasCustomPrice: !!customPrice,
      customPrices: undefined,
    };
  });
}
