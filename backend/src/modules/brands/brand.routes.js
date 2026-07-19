import { Router } from "express";
import * as brandController from "./brand.controller.js";

// Admin: full CRUD access
export const adminBrandRouter = Router();
adminBrandRouter.get("/", brandController.getAllBrands);
adminBrandRouter.get("/:id", brandController.getBrandById);
adminBrandRouter.post("/", brandController.createBrand);
adminBrandRouter.post("/:id", brandController.updateBrand);

// Retailer: read-only access
export const retailerBrandRouter = Router();
retailerBrandRouter.get("/", brandController.getAllBrands);
retailerBrandRouter.get("/:id", brandController.getBrandById);

export default adminBrandRouter;
