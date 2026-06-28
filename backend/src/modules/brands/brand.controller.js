import * as brandService from "./brand.service.js";

export async function createBrand(req, res) {
  try {
    const brand = await brandService.createBrand(req.body);
    return res.status(201).json(brand);
  } catch (error) {
    if (error.message === "BRAND_EXISTS") {
      return res.status(409).json({ message: "Brand already exists" });
    }
    console.error("createBrand error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAllBrands(req, res) {
  try {
    const brand = await brandService.getAllBrands();
    return res.status(200).json(brand);
  } catch (error) {
    console.error("getAllBrands error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getBrandById(req, res) {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    return res.status(200).json(brand);
  } catch (error) {
    console.error("getBrandById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateBrand(req, res) {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    return res.status(200).json(brand);
  } catch (error) {
    if (error.message === "BRAND_NOT_FOUND") {
      return res.status(404).json({ message: "Brand not found" });
    }
    console.error("updateBrand error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
