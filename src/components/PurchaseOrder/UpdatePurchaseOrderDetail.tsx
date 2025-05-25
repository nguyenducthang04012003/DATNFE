import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function UpdatePurchaseOrderDetail({
  isOpen,
  onClose,
  order,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSave: (updatedOrder: any) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState(order);

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

  useEffect(() => {
    setFormData(order);
  }, [order]);

  if (!mounted) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleQuantityChange = (index: number, value: number) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index].quantity = value;
    setFormData({ ...formData, products: updatedProducts });
  };

  const handleTaxChange = (index: number, value: number) => {
    const updatedProducts = [...formData.products];
    updatedProducts[index].tax = value;
    setFormData({ ...formData, products: updatedProducts });
  };

  const handleDeleteProduct = (index: number) => {
    const updatedProducts = formData.products.filter((_product: any, i: number) => i !== index);
    setFormData({ ...formData, products: updatedProducts });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      alert('Cập nhật thông tin đơn hàng thành công!');
      onClose();
    }
  };

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
            <h1 className="text-xl font-semibold text-gray-900">Cập nhật thông tin đơn đặt hàng</h1>
            <p className="text-sm text-gray-500">Cập nhật thông tin đơn đặt hàng ở form bên dưới</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <div className="w-full mb-4">
              <div className="border-[1px] border-gray-300 rounded-lg p-4 w-full">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Mã đơn đặt hàng</label>
                  <input
                    type="text"
                    name="purchaseOrderCode"
                    value={formData?.purchaseOrderCode || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                  <input
                    type="text"
                    name="supplierName"
                    value={formData?.supplierName || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Ngày đặt hàng</label>
                  <input
                    type="date"
                    name="date"
                    value={formData?.date || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Ngày giao hàng</label>
                  <input
                    type="date"
                    name="goodsIssueDate"
                    value={formData?.goodsIssueDate || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Tổng số tiền</label>
                  <input
                    type="number"
                    name="totalAmount"
                    value={formData?.totalAmount || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Phí vận chuyển</label>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={formData?.deliveryFee || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData?.address || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    name="status"
                    value={formData?.status || ""}
                    onChange={handleChange}
                    className="mt-1 border rounded p-2 w-full"
                  >
                    <option value="">Chọn trạng thái</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="pending">Đang chờ</option>
                    <option value="canceled">Đã hủy</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bảng sản phẩm */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Danh sách sản phẩm</h2>
            <div className="overflow-x-auto w-full mb-4">
              <table className="min-w-full bg-gray-50 border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="px-4 py-2">Tên sản phẩm</th>
                    <th className="px-4 py-2">Số lượng</th>
                    <th className="px-4 py-2">Giá nhập</th>
                    <th className="px-4 py-2">Thuế (VAT)</th>
                    <th className="px-4 py-2">Tổng giá</th>
                    <th className="px-4 py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {formData?.products?.map((product: any, index: number) => (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-2">{product.name || "N/A"}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleQuantityChange(index, parseInt(e.target.value))}
                          className="border rounded p-1 w-20"
                        />
                      </td>
                      <td className="px-4 py-2">{product.price || "N/A"}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={product.tax || 0}
                          onChange={(e) => handleTaxChange(index, parseFloat(e.target.value))}
                          className="border rounded p-1 w-20"
                        />
                      </td>
                      <td className="px-4 py-2">
                        {((product.quantity * product.price) * (1 + (product.tax / 100))).toFixed(2) || "N/A"}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDeleteProduct(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 w-full">
              <button type="button" onClick={onClose} className="mr-2 border rounded p-2">Hủy</button>
              <button type="submit" className="bg-blue-500 text-white rounded p-2">Lưu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}