import { Router } from "express";

import * as productController from "./product.controller.js";

// Admin: full CRUD + inventory management
export const adminProductRouter = Router();
adminProductRouter.post("/", productController.createProduct);
adminProductRouter.get("/", productController.getProducts);
adminProductRouter.get("/low-stock", productController.getLowStockProducts);
adminProductRouter.get("/:id", productController.getProductById);
adminProductRouter.put("/:id", productController.updateProduct);
adminProductRouter.post("/:id/custom-price", productController.setCustomPrice);

// Retailer: read-only catalog browsing
export const retailerProductRouter = Router();
retailerProductRouter.get("/retailer/catalog", productController.getProductsForRetailer);
retailerProductRouter.get("/:id", productController.getProductById);

export default adminProductRouter;