import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';

export default function ProductsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/admin/products').then(r => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/admin/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setEditingId(null);
    },
  });

  const filtered = products?.filter(p => {
    if (filter === 'review') return p.needsReview;
    if (filter === 'low') return p.currentStock <= p.lowStockThreshold;
    return true;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Products</h2>
        <div className="flex gap-2">
          {['all', 'review', 'low'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'review' ? 'Needs Review' : 'Low Stock'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">SKU</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Price</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered?.map((product) => (
              <tr key={product.id}>
                <td className="px-4 py-3">
                  {editingId === product.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="border border-blue-300 rounded px-2 py-1 text-sm w-full"
                      autoFocus
                    />
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      {product.variant && (
                        <p className="text-xs text-gray-500">{product.variant}</p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`text-sm font-medium ${
                    product.currentStock <= product.lowStockThreshold
                      ? 'text-red-600'
                      : 'text-gray-900'
                  }`}>
                    {product.currentStock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm text-gray-900">
                  ₹{Number(product.defaultSellingPrice).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 flex-wrap">
                    {product.needsReview && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        Review
                      </span>
                    )}
                    {product.isAiGenerated && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        AI
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {editingId === product.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({
                          id: product.id,
                          data: { name: editName, needsReview: false }
                        })}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs text-gray-500 px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(product.id); setEditName(product.name); }}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered?.length && (
          <p className="p-6 text-gray-500 text-sm">No products found</p>
        )}
      </div>
    </div>
  );
}