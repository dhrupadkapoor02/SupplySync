import { Router } from "express";
import * as orderController from "./order.controller.js";

const router = Router();

export const adminOrderRouter = Router();
export const retailerOrderRouter = Router();

adminOrderRouter.get("/", orderController.getOrdersForAdmin);
adminOrderRouter.get("/:id", orderController.getOrderById);
adminOrderRouter.post("/:id/fulfill", orderController.fulfillOrder);
adminOrderRouter.patch("/:id/status", orderController.updateOrderStatus);

retailerOrderRouter.post("/", orderController.placeOrder);
retailerOrderRouter.get("/", orderController.getOrdersForRetailer);
retailerOrderRouter.get("/:id", orderController.getOrderById);

export default adminOrderRouter;
