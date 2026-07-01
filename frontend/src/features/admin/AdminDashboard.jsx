import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api.js';

export default function AdminDashboard() {
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/admin/orders').then(r => r.data),
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/admin/products').then(r => r.data),
  });

  const { data: retailers } = useQuery({
    queryKey: ['retailers'],
    queryFn: () => api.get('/admin/retailers').then(r => r.data),
  });

  const pendingOrders = orders?.filter(o => o.status === 'PENDING').length ?? 0;
  const lowStockCount = products?.filter(
    p => p.currentStock <= p.lowStockThreshold
  ).length ?? 0;
  const pendingRetailers = retailers?.filter(r => r.status === 'PENDING').length ?? 0;
  const needsReviewCount = products?.filter(p => p.needsReview).length ?? 0;

  const stats = [
    { label: 'Pending Orders', value: pendingOrders, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Low Stock Items', value: lowStockCount, color: 'bg-red-50 text-red-700' },
    { label: 'Pending Retailers', value: pendingRetailers, color: 'bg-blue-50 text-blue-700' },
    { label: 'Products Needing Review', value: needsReviewCount, color: 'bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-xl p-6 ${stat.color}`}>
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm mt-1 opacity-80">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        {orders?.slice(0, 5).map((order) => (
          <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.retailer?.name || order.retailer?.phone}
              </p>
              <p className="text-xs text-gray-500">
                ₹{Number(order.totalAmount).toLocaleString('en-IN')}
              </p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
              order.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
              order.status === 'PARTIALLY_FULFILLED' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {order.status}
            </span>
          </div>
        ))}
        {!orders?.length && (
          <p className="text-gray-500 text-sm">No orders yet</p>
        )}
      </div>
    </div>
  );
}