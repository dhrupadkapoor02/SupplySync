import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../../lib/api.js";

export default function ShopPage() {
  const { totalItems, totalAmount } = useCart();
  const { logout } = useAuth();

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get("/brands").then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">SupplySync</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/shop/orders"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              My Orders
            </Link>
            <Link
              to="/shop/cart"
              className="relative bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Cart
              {totalItems > 0 && (
                <span className="ml-2 bg-white text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Browse Brands</h2>
        <p className="text-gray-500 mb-8">
          Select a brand to view available products
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {brands?.map((brand) => (
            <Link
              key={brand.id}
              to={`/shop/brand/${brand.id}`}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <span className="text-blue-600 font-bold text-lg">
                  {brand.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{brand.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {brand._count?.products ?? 0} products
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
