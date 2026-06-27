import { Router } from "express";
import * as authController from "./auth.controller.js";
import * as authMiddleware from "./auth.middleware.js";

const router = Router();
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTPAndLogin);
router.post("/refresh", authController.refresh);
router.post("/logout",  authMiddleware.authenticate, authController.logout);

export default router;
