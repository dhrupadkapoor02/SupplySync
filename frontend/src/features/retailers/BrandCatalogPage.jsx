import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "./CartContext.jsx";
import api from "../../lib/api.js";

export default function BrandCatalogPage() {
  const { brandId } = useParams();
  const { cart, addToCart, updateQuantity } = useCart();
  const [search, setSearch] = useState("");

  const { data: brand } = useQuery({
    queryKey: ["brand", brandId],
    queryFn: () => api.get(`/brands/${brandId}`).then(r => r.data),
  });

  const { data: products, isLoading } = useQuery({
    queryKey: ["retailer-products", brandId],
    queryFn: () =>
      api
        .get("/products", {
          params: { brandId },
        })
        .then((r) => r.data),
  });

  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function getCartQuantity(productId) {
    return cart.find((item) => item.productId === productId)?.quantity ?? 0;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/shop"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{brand?.name}</h1>
          <div className="ml-auto">
            <Link
              to="/shop/cart"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              View Cart
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {isLoading ? (
          <p className="text-gray-500">Loading products...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filtered?.map((product) => {
              const cartQty = getCartQuantity(product.id);
              const outOfStock = product.currentStock === 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.variant && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {product.variant}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-2 mb-3">
                    <p className="text-base font-bold text-gray-900">
                      ₹{Number(product.displayPrice).toLocaleString("en-IN")}
                    </p>
                    <p className="text-xs text-gray-500">
                      Stock: {product.currentStock}
                    </p>
                  </div>

                  {outOfStock ? (
                    <p className="text-xs text-center text-red-500 font-medium py-2">
                      Out of Stock
                    </p>
                  ) : cartQty === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center justify-between border border-blue-200 rounded-lg">
                      <button
                        onClick={() => updateQuantity(product.id, cartQty - 1)}
                        className="w-10 h-9 text-blue-600 font-bold hover:bg-blue-50 rounded-l-lg"
                      >
                        −
                      </button>
                      <span className="text-sm font-semibold text-gray-900">
                        {cartQty}
                      </span>
                      <button
                        onClick={() => {
                          if (cartQty < product.currentStock) {
                            updateQuantity(product.id, cartQty + 1);
                          }
                        }}
                        disabled={cartQty >= product.currentStock}
                        className="w-10 h-9 text-blue-600 font-bold hover:bg-blue-50 rounded-r-lg disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {filtered?.length === 0 && !isLoading && (
          <p className="text-gray-500 text-center py-12">No products found</p>
        )}
      </div>
    </div>
  );
}
