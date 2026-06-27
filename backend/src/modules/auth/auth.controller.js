import * as authService from "./auth.service.js";

//Send OTP
export async function sendOTP(req, res) {
  try {
    const { phone } = req.body;
    const trimmedPhone = phone?.trim();

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const otp = authService.generateOTP();
    await authService.storeOTP(phone, otp);

    // In production: send OTP via SMS provider (Twilio, MSG91)
    // In development: return OTP directly for testing
    console.log(`OTP for ${phone}: ${otp}`);

    return res.status(200).json({
      message: "OTP sent successfully",
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("sendOTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//VerifyOTP and Login
export async function verifyOTPAndLogin(req, res) {
  try {
    const { phone, otp } = req.body;
    const trimmedPhone = phone?.trim();

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    const result = await authService.verifyOTP(phone, otp);

    if (!result.valid) {
      return res.status(401).json({ message: result.reason });
    }

    const user = await authService.findOrCreateUser(phone);
    const accessToken = authService.generateAccessToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("verifyOTPAndLogin error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Refresh..
export async function refresh(req, res) {
  try {
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const result = await authService.refreshAccessToken(refreshToken);
    if (!result.valid) {
      return res.status(401).json({ message: result.reason });
    }

    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    console.error("refresh error", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//Logout
export async function logout(req, res) {
  try {
    await authService.revokeRefreshToken(req.user.userId);
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
