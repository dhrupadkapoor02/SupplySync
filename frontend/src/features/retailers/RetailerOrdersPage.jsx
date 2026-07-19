import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../../lib/api.js";

export default function RetailerOrdersPage() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            to="/shop"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Back to Shop
          </Link>
          <h1 className="text-xl font-bold text-gray-900">My Orders</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <p className="text-gray-500">Loading orders...</p>
        ) : orders?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No orders yet</p>
            <Link
              to="/shop"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-base font-bold text-gray-900 mt-0.5">
                      ₹{Number(order.totalAmount).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      order.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status === "ACCEPTED"
                          ? "bg-green-100 text-green-700"
                          : order.status === "PARTIALLY_FULFILLED"
                            ? "bg-blue-100 text-blue-700"
                            : order.status === "DISPATCHED"
                              ? "bg-purple-100 text-purple-700"
                              : order.status === "DELIVERED"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                    }`}
                  >
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                {order.adminNote && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3">
                    Note from wholesaler: {order.adminNote}
                  </p>
                )}

                <div className="space-y-2">
                  {order.orderItems?.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product?.name}
                      </span>
                      <span className="text-gray-500">
                        {item.fulfilledQuantity > 0 &&
                        item.fulfilledQuantity !== item.requestedQuantity
                          ? `${item.fulfilledQuantity}/${item.requestedQuantity} fulfilled`
                          : `×${item.requestedQuantity}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
