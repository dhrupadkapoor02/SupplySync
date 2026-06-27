import jwt from "jsonwebtoken";
import redis from "../../config/redis.js";
import prisma from "../../config/prisma.js";

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_PREFIX = "otp:";
const REFRESH_TOKEN_PREFIX = "refresh:";

// Generates a 6 digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
// Stores OTP in Redis with 5 minute expiry
export async function storeOTP(phone, otp) {
  const key = `${OTP_PREFIX}${phone}`;
  await redis.set(key, otp, "EX", OTP_EXPIRY_SECONDS);
}

// Verifies OTP from Redis
export async function verifyOTP(phone, otp) {
  const key = `${OTP_PREFIX}${phone}`;
  const stored = await redis.get(key);

  if (!stored) {
    return { valid: false, reason: "OTP Expired or not Found" };
  }
  if (stored != otp) {
    return { valid: false, reason: "Invalid OTP" };
  }

  // Delete OTP after successful verification
  // An OTP should only work once
  await redis.del(key);
  return { valid: true };
}

// Finds or creates user by phone number
export async function findOrCreateUser(phone) {
  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        name: "",
        role: "RETAILER",
        status: "PENDING",
      },
    });
  }
  return user;
}

// Generates short lived access token
export function generateAccessToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      phone: user.phone,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
}

// Generates long lived access token
export function generateRefreshToken(user) {
  return jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

// Stores refresh token in Redis
export async function storeRefreshToken(userId, refreshToken) {
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
  await redis.set(key, refreshToken, "EX", 7 * 24 * 60 * 60);
}

// Verifies refresh token and returns new access token
export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return { valid: false, reason: "Invalid refresh token" };
  }
  const key = `${REFRESH_TOKEN_PREFIX}${payload.userId}`;
  const stored = await redis.get(key);
  if (!stored || stored !== refreshToken) {
    return { valid: false, reason: "Refresh token revoked" };
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    return { valid: false, reason: "User not found" };
  }

  const newAccessToken = generateAccessToken(user);
  return { valid: true, accessToken: newAccessToken };
}

// Revokes refresh token on logout
export async function revokeRefreshToken(userId) {
  const key = `${REFRESH_TOKEN_PREFIX}${userId}`;
  await redis.del(key);
}
