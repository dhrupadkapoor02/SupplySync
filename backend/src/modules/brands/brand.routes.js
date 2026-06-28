import { Router } from "express";
import * as brandController from "./brand.controller.js";

const router = Router();

router.get("/", brandController.getAllBrands);
router.get("/:id", brandController.getBrandById);
router.post("/", brandController.createBrand);
router.post("/:id", brandController.updateBrand);

export default router;
