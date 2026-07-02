import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';

export default function RetailersPage() {
  const queryClient = useQueryClient();

  const { data: retailers } = useQuery({
    queryKey: ['retailers'],
    queryFn: () => api.get('/admin/retailers').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/retailers/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retailers'] }),
  });

  const blockMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/retailers/${id}/block`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['retailers'] }),
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Retailers</h2>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {retailers?.map((retailer) => (
          <div key={retailer.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {retailer.name || 'Unnamed'}
              </p>
              <p className="text-xs text-gray-500">{retailer.phone}</p>
              {retailer.businessName && (
                <p className="text-xs text-gray-400">{retailer.businessName}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                retailer.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                retailer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {retailer.status}
              </span>
              {retailer.status === 'PENDING' && (
                <button
                  onClick={() => approveMutation.mutate(retailer.id)}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                >
                  Approve
                </button>
              )}
              {retailer.status === 'APPROVED' && (
                <button
                  onClick={() => blockMutation.mutate(retailer.id)}
                  className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200"
                >
                  Block
                </button>
              )}
            </div>
          </div>
        ))}
        {!retailers?.length && (
          <p className="p-6 text-gray-500 text-sm">No retailers yet</p>
        )}
      </div>
    </div>
  );
}