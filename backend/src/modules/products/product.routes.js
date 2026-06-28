import { Router } from "express";

import * as productController from "./product.controller.js";

const router = Router();

router.post("/", productController.createProduct);
router.get("/", productController.getProducts);
router.get("/low-stock", productController.getLowStockProducts);
router.get("/:id", productController.getProductById);
router.put("/:id", productController.updateProduct);

router.post("/:id/custom-price", productController.setCustomPrice);

// Retailer Route
router.get("/retailer/catalog", productController.getProductsForRetailer);

export default router;
