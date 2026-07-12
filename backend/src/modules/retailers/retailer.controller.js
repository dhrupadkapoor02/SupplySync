import * as retailerService from "./retailer.service.js";

export async function getAllRetailers(req, res) {
  try {
    const retailers = await retailerService.getAllRetailers();
    return res.status(200).json(retailers);
  } catch (error) {
    console.error("getAllRetailers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function approveRetailer(req, res) {
  try {
    const retailer = await retailerService.approveRetailer(req.params.id);
    return res.status(200).json(retailer);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.message === "NOT_A_RETAILER") {
      return res.status(400).json({ message: "User is not a retailer" });
    }
    console.error("approveRetailer error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function blockRetailer(req, res) {
  try {
    const retailer = await retailerService.blockRetailer(req.params.id);
    return res.status(200).json(retailer);
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "User not found" });
    }
    if (error.message === "NOT_A_RETAILER") {
      return res.status(400).json({ message: "User is not a retailer" });
    }
    console.error("blockRetailer error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
