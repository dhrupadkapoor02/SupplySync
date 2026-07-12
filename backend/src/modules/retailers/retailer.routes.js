import { Router } from "express";
import * as retailerController from "./retailer.controller.js";

const router = Router();

router.get("/", retailerController.getAllRetailers);
router.patch("/:id/approve", retailerController.approveRetailer);
router.patch("/:id/block", retailerController.blockRetailer);

export default router;
