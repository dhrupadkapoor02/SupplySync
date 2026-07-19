import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "./CartContext.jsx";
import api from "../../lib/api.js";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalAmount } =
    useCart();
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);

  const orderMutation = useMutation({
    mutationFn: () =>
      api.post("/orders", {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      }),
    onSuccess: () => {
      clearCart();
      setSuccess(true);
      setTimeout(() => navigate("/shop/orders"), 2000);
    },
  });

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed!
          </h2>
          <p className="text-gray-500">Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            to="/shop"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/shop"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Continue Shopping
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Your Cart</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 mb-4">
          {cart.map((item) => (
            <div key={item.productId} className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                {item.variant && (
                  <p className="text-xs text-gray-500">{item.variant}</p>
                )}
                <p className="text-sm font-bold text-gray-900 mt-1">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </p>
              </div>

              <div className="flex items-center border border-gray-200 rounded-lg">
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity - 1)
                  }
                  className="w-9 h-9 text-gray-600 hover:bg-gray-50 rounded-l-lg"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(item.productId, item.quantity + 1)
                  }
                  disabled={item.quantity >= item.maxStock}
                  className="w-9 h-9 text-gray-600 hover:bg-gray-50 rounded-r-lg disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-red-400 hover:text-red-600 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Subtotal</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>₹{totalAmount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {orderMutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            Failed to place order. Please try again.
          </div>
        )}

        <button
          onClick={() => orderMutation.mutate()}
          disabled={orderMutation.isPending}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {orderMutation.isPending ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </div>
  );
}
