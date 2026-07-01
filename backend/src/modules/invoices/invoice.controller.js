import * as invoiceService from "./invoice.service.js";

export async function uploadAndProcess(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Invoice file is required" });
    }

    const { brandId } = req.body;
    if (!brandId) {
      return res.status(400).json({ message: "Brand ID is required" });
    }

    const result = await invoiceService.processInvoice(
      req.file.buffer,
      req.file.mimetype,
      brandId,
      req.user.userId,
    );

    return res.status(201).json(result);
  } catch (error) {
    if (error.message === "BRAND_NOT_FOUND") {
      return res.status(404).json({ message: "Brand not found" });
    }
    if (error.message === "OCR_FAILED") {
      return res
        .status(422)
        .json({ message: "Could not extract text from image" });
    }
    if (error.message === "LLM_PARSE_FAILED") {
      return res
        .status(422)
        .json({ message: "Could not parse invoice structure" });
    }
    console.error("uploadAndProcess error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function confirmInvoice(req, res) {
  try {
    const invoice = await invoiceService.confirmInvoice(
      req.params.id,
      req.user.userId,
    );
    return res.status(200).json(invoice);
  } catch (error) {
    if (error.message === "INVOICE_NOT_FOUND") {
      return res.status(404).json({ message: "Invoice not found" });
    }
    if (error.message === "ALREADY_CONFIRMED") {
      return res.status(409).json({ message: "Invoice already confirmed" });
    }
    console.error("confirmInvoice error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getInvoices(req, res) {
  try {
    const invoices = await invoiceService.getInvoices(req.query);
    return res.status(200).json(invoices);
  } catch (error) {
    console.error("getInvoices error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getInvoiceById(req, res) {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);
    return res.status(200).json(invoice);
  } catch (error) {
    if (error.message === "INVOICE_NOT_FOUND") {
      return res.status(404).json({ message: "Invoice not found" });
    }
    console.error("getInvoiceById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
