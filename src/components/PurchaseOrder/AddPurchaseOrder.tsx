import React, { useState, useEffect } from "react";
import { Form, Select, Button, Table, message, InputNumber } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";

// Hàm loại bỏ dấu tiếng Việt
const removeVietnameseTones = (str: string) => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
};

interface Supplier {
  id: number;
  supplierName: string;
  supplierCode: string;
  supplierAddress: string;
  supplierPhone: string;
  status: boolean;
  createdBy: number;
  createdDate: string;
}

interface Product {
  productId: number;
  productCode: string;
  manufactureName: string;
  productName: string;
  unit: string;
  categoryName: string;
  description: string;
  sellingPrice: number;
  createdBy: number;
  createdDate: string | null;
  status: boolean;
  vat: number;
  storageconditions: number;
  weight: number;
  images: string[];
}

interface SelectedProduct {
  id: number;
  name: string;
  quantity: number;
  supplyPrice: number;
  totalPrice: number;
}

const PurchaseOrderModal: React.FC = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0); // Thêm state để quản lý totalAmount

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Tính lại totalAmount mỗi khi selectedProducts thay đổi
  useEffect(() => {
    const newTotalAmount = selectedProducts.reduce(
      (sum, product) => sum + product.totalPrice,
      0
    );
    setTotalAmount(newTotalAmount);
  }, [selectedProducts]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken") || "your-default-token";

      try {
        const supplierResponse = await axios.get(
          `${API_BASE_URL}/Supplier/GetSupplierListActive`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSuppliers(supplierResponse.data.data || []);

        const productResponse = await axios.get(
          `${API_BASE_URL}/Product/ListProduct`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProducts(productResponse.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        message.error("Không thể tải danh sách nhà cung cấp hoặc sản phẩm!");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleAddProduct = (product: Product) => {
    if (!selectedSupplier) {
      message.error("Vui lòng chọn nhà cung cấp trước!");
      return;
    }
    setSelectedProducts((prev) => [
      ...prev,
      {
        id: product.productId,
        name: product.productName,
        quantity,
        supplyPrice: 0,
        totalPrice: 0,
      },
    ]);
    setSearchTerm("");
    setQuantity(1);
  };

  const handleQuantityChange = (id: number, newQuantity: number | null) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              quantity: newQuantity || 1,
              totalPrice: (newQuantity || 1) * product.supplyPrice,
            }
          : product
      )
    );
  };

  const handleSupplyPriceChange = (id: number, newPrice: number | null) => {
    setSelectedProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              supplyPrice: newPrice || 0,
              totalPrice: product.quantity * (newPrice || 0),
            }
          : product
      )
    );
  };

  const handleDeleteProduct = (id: number) => {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  };

  const columns = [
    { title: "Sản phẩm", dataIndex: "name", key: "name" },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number, record: SelectedProduct) => (
        <InputNumber
          min={1}
          value={quantity}
          onChange={(value) => handleQuantityChange(record.id, value)}
          className="w-20"
        />
      ),
    },
    {
      title: "Giá nhập",
      dataIndex: "supplyPrice",
      key: "supplyPrice",
      render: (supplyPrice: number, record: SelectedProduct) => (
        <InputNumber
          min={0}
          value={supplyPrice}
          onChange={(value) => handleSupplyPriceChange(record.id, value)}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value?.replace(/\$\s?|(,*)/g, "") as any}
          className="w-32"
        />
      ),
    },
    {
      title: "Tổng giá (VND)",
      dataIndex: "totalPrice",
      key: "totalPrice",
      render: (totalPrice: number) => totalPrice.toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: SelectedProduct) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDeleteProduct(record.id)}
        />
      ),
    },
  ];

  const handleSubmit = async () => {
    if (!user) {
      message.error("Vui lòng đăng nhập để tạo đơn hàng!");
      return;
    }
    if (!selectedSupplier) {
      message.error("Vui lòng chọn nhà cung cấp!");
      return;
    }
    if (selectedProducts.length === 0) {
      message.error("Vui lòng thêm ít nhất một sản phẩm!");
      return;
    }
    if (selectedProducts.some((p) => p.supplyPrice <= 0)) {
      message.error("Vui lòng nhập giá nhập hợp lệ cho tất cả sản phẩm!");
      return;
    }

    const purchaseOrderData = {
      supplierId: selectedSupplier.id,
      totalAmount,
      status: 1,
      createdBy: user.customerId,
      createDate: new Date().toISOString(),
      purchaseOrdersDetails: selectedProducts.map((p) => ({
        productId: p.id,
        quantity: p.quantity,
        supplyPrice: p.supplyPrice,
      })),
    };

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.post(
        `${API_BASE_URL}/PurchaseOrders/CreatePurchaseOrders`,
        purchaseOrderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      message.success(
        `Đơn hàng ${response.data.data.purchaseOrderCode} đã được tạo thành công!`
      );
      form.resetFields();
      setSelectedProducts([]);
      setSelectedSupplier(null);
    } catch (error) {
      console.error("Lỗi khi tạo đơn hàng:", error);
      message.error("Tạo đơn hàng thất bại!");
    }
  };

  return (
    <div className="p-6 mt-[60px] w-full bg-[#fafbfe]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Tạo đơn đặt hàng (PO)
        </h1>
        <p className="text-sm text-gray-500">Tạo đơn đặt hàng mới</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Nhà cung cấp"
              name="supplier"
              rules={[
                { required: true, message: "Vui lòng chọn nhà cung cấp!" },
              ]}
            >
              <Select
                showSearch
                placeholder="Chọn nhà cung cấp"
                loading={loading}
                onChange={(value) => {
                  const supplier =
                    suppliers.find((s) => s.id === value) || null;
                  setSelectedSupplier(supplier);
                }}
                filterOption={(input, option) =>
                  removeVietnameseTones(
                    option?.children?.toString() || ""
                  ).includes(removeVietnameseTones(input))
                }
                notFoundContent={
                  suppliers.length === 0 ? "Không có dữ liệu" : null
                }
              >
                {suppliers.map((supplier) => (
                  <Select.Option key={supplier.id} value={supplier.id}>
                    {supplier.supplierName}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* <Form.Item label="Tổng số tiền (VND)" name="totalAmount">
              <Input value={totalAmount.toLocaleString("vi-VN")} disabled />
            </Form.Item> */}
          </div>

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              Thêm sản phẩm
            </h2>
            <div className="flex gap-4 mb-4">
              <Select
                showSearch
                value={searchTerm}
                onSearch={handleSearchChange}
                onChange={(value) => {
                  const product = products.find((p) => p.productName === value);
                  if (product) handleAddProduct(product);
                }}
                placeholder="Tìm kiếm sản phẩm"
                style={{ width: 200 }}
                loading={loading}
                filterOption={(input, option) =>
                  removeVietnameseTones(
                    option?.children?.toString() || ""
                  ).includes(removeVietnameseTones(input))
                }
                notFoundContent={
                  products.length === 0 ? "Không có dữ liệu" : null
                }
              >
                {products.map((product) => (
                  <Select.Option
                    key={product.productId}
                    value={product.productName}
                  >
                    {product.productName}
                  </Select.Option>
                ))}
              </Select>
              <InputNumber
                min={1}
                value={quantity}
                onChange={(value) => setQuantity(value || 1)}
                placeholder="Số lượng"
                className="w-20"
              />
            </div>

            <Table
              columns={columns}
              dataSource={selectedProducts}
              rowKey="id"
              pagination={false}
              bordered
            />
          </div>

          <div className="text-right text-lg font-semibold mt-4">
            Tổng giá trị đơn hàng: {totalAmount.toLocaleString("vi-VN")} VND
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <Button onClick={() => form.resetFields()}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
