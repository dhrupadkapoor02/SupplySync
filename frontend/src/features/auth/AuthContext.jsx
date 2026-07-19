import { createContext, useContext, useState, useEffect } from "react";
import api from "../../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  async function sendOTP(phone) {
    const { data } = await api.post("/auth/send-otp", { phone });

    if (data.otp) {
      console.log(
        `%c[DEV MODE] OTP for ${phone}: ${data.otp}`,
        "color: #10b981; font-weight: bold; font-size: 14px;",
      );
    }

    return data;
  }

  async function verifyOTP(phone, otp) {
    const { data } = await api.post("/auth/verify-otp", { phone, otp });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, sendOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
