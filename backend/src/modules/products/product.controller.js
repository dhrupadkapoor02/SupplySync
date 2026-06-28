import prisma from "../../config/prisma.js";
import * as productService from "./product.service.js";

export async function createProduct(req, res) {
  try {
    const product = await productService.createProduct(req.body);
    return res.status(201).json(product);
  } catch (error) {
    if (error.message === "BRAND_NOT_FOUND") {
      return res.status(404).json({ message: "Brand not found" });
    }
    if (error.message === "SKU_EXISTS") {
      return res.status(409).json({ message: "SKU already exists" });
    }
    console.error("createProduct error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProducts(req, res) {
  try {
    const products = await productService.getProducts(req.query);
    return res.status(200).json(products);
  } catch (error) {
    console.error("getProducts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProductById(req, res) {
  try {
    const product = await productService.getProductById(req.params.id);
    return res.status(200).json(product);
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
export async function updateProduct(req, res) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    return res.status(200).json(product);
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error("updateProduct error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getLowStockProducts(req, res) {
  try {
    const products = await productService.getLowStockProducts();
    return res.status(200).json(products);
  } catch (error) {
    console.error("getLowStockProducts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function setCustomPrice(req, res) {
  try {
    const { userId, customPrice } = req.body;
    const { id: productId } = req.params;

    const result = await productService.setCustomPrice(
      userId,
      productId,
      customPrice,
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(404).json({ message: "Product not found" });
    }
    console.error("setCustomPrice error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getProductsForRetailer(req, res) {
  try {
    const products = await productService.getProductsForRetailer(
      req.user.userId,
      req.query,
    );
    return res.status(200).json(products);
  } catch (error) {
    console.error("getProductsForRetailer error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
