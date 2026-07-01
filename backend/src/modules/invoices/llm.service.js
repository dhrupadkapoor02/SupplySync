import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function extractInvoiceData(rawText) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
You are an expert at extracting structured data from Indian GST invoices.

Extract the following information from this invoice text and return ONLY valid JSON.
Do not include any explanation, markdown, or code blocks. Just raw JSON.

Required format:
{
  "supplier_name": "string",
  "invoice_number": "string", 
  "invoice_date": "YYYY-MM-DD",
  "total_amount": number,
  "gst_amount": number,
  "items": [
    {
      "name": "string",
      "hsn_code": "string or null",
      "quantity": number,
      "unit": "string or null",
      "purchase_price": number,
      "gst_percent": number or null
    }
  ]
}

Rules:
- invoice_date must be in YYYY-MM-DD format
- All prices must be numbers, not strings
- quantity must be a number
- If a field cannot be found, use null
- Extract ALL line items from the invoice

Invoice text:
${rawText}
`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  try {
    const cleaned = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch {
    throw new Error("LLM_PARSE_FAILED");
  }
}

export function calculateConfidenceScore(extractedData) {
  let score = 100;
  const issues = [];

  if (!extractedData.supplier_name) {
    score -= 20;
    issues.push("Missing supplier name");
  }

  if (!extractedData.invoice_number) {
    score -= 20;
    issues.push("Missing invoice number");
  }

  if (!extractedData.invoice_date) {
    score -= 15;
    issues.push("Missing invoice date");
  }

  if (!extractedData.items || extractedData.items.length === 0) {
    score -= 40;
    issues.push("No items extracted");
  } else {
    for (const item of extractedData.items) {
      if (!item.name) {
        score -= 10;
        issues.push("Item missing name");
      }
      if (!item.quantity || item.quantity <= 0) {
        score -= 10;
        issues.push(`Invalid quantity for ${item.name}`);
      }
      if (!item.purchase_price || item.purchase_price <= 0) {
        score -= 10;
        issues.push(`Invalid price for ${item.name}`);
      }
    }
  }

  return {
    score: Math.max(0, score),
    issues,
    requiresReview: score < 90,
  };
}
