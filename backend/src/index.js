import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import morgan from "morgan";
import authRoutes from "./modules/auth/auth.route.js";
import {
  adminBrandRouter,
  retailerBrandRouter,
} from "./modules/brands/brand.routes.js";
import {
  adminProductRouter,
  retailerProductRouter,
} from "./modules/products/product.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import retailerRoutes from "./modules/retailers/retailer.routes.js";
import {
  adminOrderRouter,
  retailerOrderRouter,
} from "./modules/orders/order.routes.js";
import {
  authenticate,
  authorizeAdmin,
  authorizeApprovedRetailer,
} from "./modules/auth/auth.middleware.js";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

//CORS

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());
// Request logging
app.use(morgan("dev"));

//Public Routes
app.use("/api/auth", authRoutes);

//Admin only Routes
app.use("/api/admin/brands", authenticate, authorizeAdmin, adminBrandRouter);
app.use(
  "/api/admin/products",
  authenticate,
  authorizeAdmin,
  adminProductRouter,
);
app.use("/api/admin/orders", authenticate, authorizeAdmin, adminOrderRouter);
app.use("/api/admin/invoices", authenticate, authorizeAdmin, invoiceRoutes);
app.use("/api/admin/retailers", authenticate, authorizeAdmin, retailerRoutes);

//Retailer Routes
app.use(
  "/api/products",
  authenticate,
  authorizeApprovedRetailer,
  retailerProductRouter,
);
app.use(
  "/api/orders",
  authenticate,
  authorizeApprovedRetailer,
  retailerOrderRouter,
);
app.use(
  "/api/brands",
  authenticate,
  authorizeApprovedRetailer,
  retailerBrandRouter,
);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
