import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function authorizeAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function authorizeApprovedRetailer(req, res, next) {
  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.status === "PENDING") {
    return res.status(403).json({
      message: "Your account is pending admin approval",
    });
  }

  if (req.user.status === "BLOCKED") {
    return res.status(403).json({ message: "Your account has been blocked" });
  }

  next();
}
