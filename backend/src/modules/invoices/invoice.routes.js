import { Router } from "express";
import * as invoiceController from "./invoice.controller.js";
import upload from "../../config/multer.js";

const router = Router();

router.post(
  "/upload",
  upload.single("invoice"),
  invoiceController.uploadAndProcess,
);
router.get("/", invoiceController.getInvoices);
router.get("/:id", invoiceController.getInvoiceById);
router.post("/:id/confirm", invoiceController.confirmInvoice);

export default router;
