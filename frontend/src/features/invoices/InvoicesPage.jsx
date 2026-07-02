import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/api.js";

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedBrandId, setSelectedBrandId] = useState("");
  const [file, setFile] = useState(null);

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get("/admin/brands").then((r) => r.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => api.get("/admin/invoices").then((r) => r.data),
  });

  async function handleUpload() {
    if (!file || !selectedBrandId) return;

    const formData = new FormData();
    formData.append("invoice", file);
    formData.append("brandId", selectedBrandId);

    setUploading(true);
    setUploadResult(null);

    try {
      const { data } = await api.post("/admin/invoices/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(data);
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    } catch (err) {
      setUploadResult({
        error: err.response?.data?.message || "Upload failed",
      });
    } finally {
      setUploading(false);
    }
  }

  const confirmMutation = useMutation({
    mutationFn: (invoiceId) => api.post(`/admin/invoices/${invoiceId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Invoice Processing
      </h2>

      {/* Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Upload Invoice
        </h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select brand...</option>
              {brands?.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice File
            </label>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
            />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !selectedBrandId}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {uploading
            ? "Processing... (this may take 2-3 minutes)"
            : "Process Invoice with AI"}
        </button>

        {uploading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              AI is extracting data from your invoice. OCR and LLM processing in
              progress...
            </p>
          </div>
        )}

        {uploadResult && !uploadResult.error && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">
              Processing Complete
            </p>
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {uploadResult.summary?.totalItems}
                </p>
                <p className="text-green-600">Total Items</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {uploadResult.summary?.matchedProducts}
                </p>
                <p className="text-blue-600">Matched</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {uploadResult.summary?.newProducts}
                </p>
                <p className="text-purple-600">New Products</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-700">
                  {Math.round(uploadResult.confidence?.score)}%
                </p>
                <p className="text-gray-600">Confidence</p>
              </div>
            </div>
            {uploadResult.requiresReview && (
              <p className="text-sm text-yellow-700 mt-2">
                Review required before confirming inventory update.
              </p>
            )}
          </div>
        )}

        {uploadResult?.error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">{uploadResult.error}</p>
          </div>
        )}
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Invoice History
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {invoices?.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {invoice.supplierName}
                </p>
                <p className="text-xs text-gray-500">
                  {invoice.invoiceNumber} ·{" "}
                  {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
                </p>
                {invoice.items?.length > 0 && (
                  <p className="text-xs text-gray-400">
                    {invoice.items.length} items
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    invoice.status === "CONFIRMED"
                      ? "bg-green-100 text-green-700"
                      : invoice.status === "NEEDS_REVIEW"
                        ? "bg-yellow-100 text-yellow-700"
                        : invoice.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {invoice.status}
                </span>
                {invoice.status === "NEEDS_REVIEW" &&
                  invoice.items?.length > 0 && (
                    <button
                      onClick={() => confirmMutation.mutate(invoice.id)}
                      disabled={confirmMutation.isPending}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                  )}
              </div>
            </div>
          ))}
          {!invoices?.length && (
            <p className="p-6 text-gray-500 text-sm">No invoices yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
