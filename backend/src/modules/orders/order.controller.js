import * as orderService from "./order.service.js";

export async function placeOrder(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    const order = await orderService.placeOrder(req.user.userId, items);
    return res.status(201).json(order);
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res
        .status(404)
        .json({ message: "One or more products not found" });
    }
    if (error.message.startsWith("INSUFFICIENT_STOCK")) {
      const productName = error.message.split(":")[1];
      return res.status(400).json({
        message: `Insufficient stock for ${productName}`,
      });
    }
    console.error("placeOrder error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOrdersForAdmin(req, res) {
  try {
    const orders = await orderService.getOrdersForAdmin(req.query);
    return res.status(200).json(orders);
  } catch (error) {
    console.error("getOrdersForAdmin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    return res.status(200).json(order);
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    console.error("getOrderById error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function fulfillOrder(req, res) {
  try {
    const { items, adminNote } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Fulfilled items are required" });
    }

    const order = await orderService.fulfillOrder(
      req.params.id,
      items,
      req.user.userId,
      adminNote,
    );
    return res.status(200).json(order);
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    if (error.message === "ORDER_ALREADY_PROCESSED") {
      return res
        .status(409)
        .json({ message: "Order has already been processed" });
    }
    if (error.message.startsWith("INSUFFICIENT_STOCK")) {
      const productName = error.message.split(":")[1];
      return res.status(400).json({
        message: `Insufficient stock for ${productName}`,
      });
    }
    console.error("fulfillOrder error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function getOrdersForRetailer(req, res) {
  try {
    const orders = await orderService.getOrdersForRetailer(req.user.userId);
    return res.status(200).json(orders);
  } catch (error) {
    console.error("getOrdersForRetailer error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.userId,
    );
    return res.status(200).json(order);
  } catch (error) {
    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({ message: "Order not found" });
    }
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
