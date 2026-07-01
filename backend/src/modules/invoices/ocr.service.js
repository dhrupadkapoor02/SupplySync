import cloudinary from '../../config/cloudinary.js';
import Tesseract from 'tesseract.js';
import { pdf } from 'pdf-to-img';

export async function uploadInvoiceToCloudinary(fileBuffer, mimetype, invoiceNumber) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'supplysync/invoices',
        resource_type: 'auto',
        public_id: `invoice_${invoiceNumber}_${Date.now()}`,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

async function convertPdfToImages(fileBuffer) {
  const document = await pdf(fileBuffer, { scale: 2 });
  const imageBuffers = [];

  for await (const imageBuffer of document) {
    imageBuffers.push(imageBuffer);
  }

  return imageBuffers;
}

export async function extractTextFromFile(fileBuffer, mimetype) {
  let imageBuffers = [];

  if (mimetype === 'application/pdf') {
    imageBuffers = await convertPdfToImages(fileBuffer);
  } else {
    imageBuffers = [fileBuffer];
  }

  let fullText = '';

  for (let i = 0; i < imageBuffers.length; i++) {
    const result = await Tesseract.recognize(imageBuffers[i], 'eng', {
      logger: () => {}, // suppress verbose progress logs
    });
    fullText += result.data.text + '\n';
  }

  if (!fullText.trim()) {
    throw new Error('OCR_FAILED');
  }

  return fullText;
}