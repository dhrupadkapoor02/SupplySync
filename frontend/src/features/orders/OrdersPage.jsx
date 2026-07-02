import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [fulfillData, setFulfillData] = useState({});

  const { data: orders } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get("/admin/orders").then((r) => r.data),
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ orderId, items, adminNote }) =>
      api.post(`/admin/orders/${orderId}/fulfill`, { items, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedOrder(null);
      setFulfillData({});
    },
  });

  function handleFulfill(order) {
    const items = order.orderItems.map((item) => ({
      productId: item.productId,
      fulfilledQuantity: fulfillData[item.id] ?? item.requestedQuantity,
    }));
    fulfillMutation.mutate({ orderId: order.id, items });
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {orders?.map((order) => (
          <div key={order.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {order.retailer?.name || order.retailer?.phone}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN")} ·
                  {order.orderItems?.length} items · ₹
                  {Number(order.totalAmount).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    order.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "ACCEPTED"
                        ? "bg-green-100 text-green-700"
                        : order.status === "PARTIALLY_FULFILLED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {order.status}
                </span>
                {order.status === "PENDING" && (
                  <button
                    onClick={() =>
                      setSelectedOrder(
                        selectedOrder?.id === order.id ? null : order,
                      )
                    }
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-lg"
                  >
                    Fulfill
                  </button>
                )}
              </div>
            </div>

            {selectedOrder?.id === order.id && (
              <div className="mt-4 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Set fulfilled quantities:
                </p>
                {order.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 mb-2">
                    <p className="text-sm text-gray-600 flex-1">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested: {item.requestedQuantity}
                    </p>
                    <input
                      type="number"
                      min="0"
                      max={item.requestedQuantity}
                      defaultValue={item.requestedQuantity}
                      onChange={(e) =>
                        setFulfillData((prev) => ({
                          ...prev,
                          [item.id]: Number(e.target.value),
                        }))
                      }
                      className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                ))}
                <button
                  onClick={() => handleFulfill(order)}
                  disabled={fulfillMutation.isPending}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {fulfillMutation.isPending
                    ? "Processing..."
                    : "Confirm Fulfillment"}
                </button>
              </div>
            )}
          </div>
        ))}
        {!orders?.length && (
          <p className="p-6 text-gray-500 text-sm">No orders yet</p>
        )}
      </div>
    </div>
  );
}
