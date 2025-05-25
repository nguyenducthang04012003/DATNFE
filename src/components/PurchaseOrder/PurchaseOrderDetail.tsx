import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function PurchaseOrderDetail({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out bg-black/30 backdrop-blur-sm ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl transition-all duration-300 ease-out transform ${
          visible ? "translate-y-0 scale-100 opacity-100" : "-translate-y-8 scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Thông tin đơn đặt hàng</h1>
            <p className="text-sm text-gray-500">Xem thông tin đơn đặt hàng ở dưới đây</p>
          </div>

          <div className="flex justify-center">
            <div className="border-[1px] border-gray-300 rounded-lg p-4 w-full">
              {/* Thông tin đơn hàng */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Mã đơn đặt hàng</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.purchaseOrderCode || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.supplierName || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Ngày đặt hàng</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.date || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Ngày giao hàng</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.goodsIssueDate || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Tổng số tiền</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.totalAmount || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Phí vận chuyển</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.deliveryFee || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.address || "N/A"}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                  {order?.status || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Thông tin người tạo và thời điểm tạo */}
          <div className="mt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Tạo bởi</label>
              <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                {order?.createdBy || "N/A"}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Thời điểm tạo</label>
              <div className="mt-1 border rounded p-2 w-full bg-gray-100">
                {order?.createdDate || "N/A"}
              </div>
            </div>
          </div>

          {/* Bảng sản phẩm trong đơn hàng */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách sản phẩm</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-50 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2">Tên sản phẩm</th>
                  <th className="px-4 py-2">Số lượng</th>
                  <th className="px-4 py-2">Giá nhập</th>
                  <th className="px-4 py-2">Thuế (VAT)</th>
                  <th className="px-4 py-2">Tổng giá</th>
                </tr>
              </thead>
              <tbody>
                {order?.products?.map((product: any) => (
                  <tr key={product.id} className="border-b">
                    <td className="px-4 py-2">{product.name || "N/A"}</td>
                    <td className="px-4 py-2">{product.quantity || "N/A"}</td>
                    <td className="px-4 py-2">{product.price || "N/A"}</td>
                    <td className="px-4 py-2">{product.tax || "N/A"}</td>
                    <td className="px-4 py-2">
                      {((product.quantity * product.price) * (1 + (product.tax / 100))).toFixed(2) || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Nút Đóng */}
          <div className="flex justify-end mt-4">
            <button type="button" onClick={onClose} className="border rounded p-2">Đóng</button>
          </div>
        </div>
      </div>
    </div>
  );
}