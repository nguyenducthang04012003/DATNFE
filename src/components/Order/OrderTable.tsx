import React, { useState, useEffect } from "react";
import { Table, Select, Button, Modal, Input, Collapse, DatePicker, Dropdown, Menu, message } from "antd";
import { MoreOutlined, EyeOutlined, FilterOutlined, ExclamationCircleOutlined, PayCircleOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { apiClient } from "../../pages/Home/AuthContext";
import axios from "axios";

const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Order {
  orderId: number;
  orderCode: string;
  customerId: number;
  updatedStatusDate: string;
  stockReleaseDate: string | null;
  totalAmount: number;
  status: number;
  wardCode: string;
  districtId: number;
  deliveryFee: number | null;
  address: string | null;
  confirmedBy: number | null;
  createdDate: string;
  assignTo: number | null;
  customer: {
    userId: number;
    userName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface Product {
  productId: number;
  unit: string;
}

interface OrderDetail {
  orderDetailId: number;
  orderId: number;
  productId: number;
  quantity: number;
  product: {
    productId: number;
    productCode: string;
    manufactureName: string;
    productName: string;
    sellingPrice: number;
    description: string;
    vat: number;
    unit: string;
  };
}

interface OrderTableProps {
  orders: Order[];
  handleChangePage: (page: string, orderId?: number) => void;
  onUpdate: (updatedOrder: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, handleChangePage, onUpdate }) => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const orderStatuses = [
    "Hủy",
    "Đang chờ thanh toán",
    "Đang chờ xác nhận",
    "Xác nhận",
    "Vận chuyển",
    "Hoàn thành",
  ];
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch product list to get units
  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Product/ListProduct`, {
        headers: { accept: "text/plain" },
      });
      const productList: Product[] = response.data.data.map((item: any) => ({
        productId: item.productId,
        unit: item.unit,
      }));
      setProducts(productList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách sản phẩm:", error);
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

  // Handle VNPay callback
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const transactionStatus = params.get("vnp_TransactionStatus");
    const orderId = params.get("vnp_TxnRef");

    if (transactionStatus && orderId) {
      const numericOrderId = parseInt(orderId);
      if (transactionStatus === "00") {
        // Payment successful, update status to 2 ("Đang chờ xác nhận")
        updateOrderStatus(numericOrderId, 2, "Thanh toán thành công, trạng thái đơn hàng đã được cập nhật!");
      } else {
        // Payment failed, update status to 0 ("Hủy")
        updateOrderStatus(numericOrderId, 0, "Thanh toán thất bại, đơn hàng đã bị hủy!");
      }
      // Clear payment-related localStorage items
      localStorage.removeItem("isPaymentInProgress");
      localStorage.removeItem("lastOrderId");
      localStorage.removeItem("lastUsername");
      // Clear query params after processing
      navigate(location.pathname, { replace: true });
      // navigate(0);
    }
  }, [location, navigate]);

  const updateOrderStatus = async (orderId: number, status: number, successMessage: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await apiClient.put(
        `/Order/UpdateOrderStatus/${orderId}/${status}`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        message.success(successMessage);
        setFilteredOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status } : order
          )
        );
        onUpdate({ ...response.data.data, orderId });
        window.location.reload();
      } else {
        message.error(response.data.message || "Không thể cập nhật trạng thái đơn hàng!");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      message.error("Không thể cập nhật trạng thái đơn hàng!");
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await apiClient.get(
        `/Order/GetOrdersDetailByOrderId/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const details: OrderDetail[] = response.data.data || [];
      // Map product units to order details
      const updatedDetails = details.map((detail) => {
        const product = products.find((p) => p.productId === detail.productId);
        return {
          ...detail,
          product: {
            ...detail.product,
            unit: product?.unit || "N/A",
          },
        };
      });
      setOrderDetails(updatedDetails);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      message.error("Không thể lấy chi tiết đơn hàng!");
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await apiClient.put(
        `/Order/UpdateOrderStatus/${orderId}/0`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        message.success("Hủy đơn hàng thành công!");
        onUpdate({ ...selectedOrder!, status: 0 });
        setFilteredOrders((prev) =>
          prev.map((order) => (order.orderId === orderId ? { ...order, status: 0 } : order))
        );
      } else {
        message.error(response.data.message || "Không thể hủy đơn hàng!");
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn hàng:", error);
      message.error("Lỗi khi hủy đơn hàng!");
    }
  };

  const handlePayOrder = async (order: Order) => {
    try {
      const token = localStorage.getItem("accessToken");
      // Save payment-related state before redirecting
      localStorage.setItem("isPaymentInProgress", "true");
      localStorage.setItem("lastOrderId", order.orderId.toString());
      localStorage.setItem("lastUsername", order.customer.userName);
      const description = `${order.customer.userName} chuyển tiền`;
      const totalWithDelivery = order.totalAmount + (order.deliveryFee || 0);
      const response = await apiClient.get(`/VNPay/CreatePaymentUrl`, {
        params: {
          moneyToPay: totalWithDelivery,
          description: description,
          orderId: order.orderId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 201 && response.data) {
        window.location.href = response.data;
      } else {
        message.error("Không thể tạo URL thanh toán!");
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo URL thanh toán:", error);
      if (error.response?.data?.message?.includes("đơn hàng đã tồn tại hoặc đang được xử lý")) {
        message.error("Đơn hàng này đã được thanh toán hoặc đang xử lý!");
        updateOrderStatus(order.orderId, order.status, "Cập nhật trạng thái đơn hàng!");
      } else {
        message.error("Lỗi khi tạo URL thanh toán!");
      }
    }
  };

  const showCancelConfirm = (order: Order) => {
    Modal.confirm({
      title: "Xác nhận hủy đơn hàng",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn hủy đơn hàng "${order.orderCode}" không?`,
      okText: "Hủy đơn hàng",
      okType: "danger",
      cancelText: "Thoát",
      onOk: () => handleCancelOrder(order.orderId),
    });
  };

  const showPayConfirm = (order: Order) => {
    const totalWithDelivery = order.totalAmount + (order.deliveryFee || 0);
    Modal.confirm({
      title: "Xác nhận thanh toán đơn hàng",
      icon: <PayCircleOutlined />,
      content: `Bạn có chắc chắn muốn thanh toán đơn hàng "${order.orderCode}" với số tiền ${totalWithDelivery.toLocaleString()} VND (bao gồm ${order.deliveryFee?.toLocaleString() || 0} VND phí vận chuyển) không?`,
      okText: "Thanh toán",
      okType: "primary",
      cancelText: "Thoát",
      onOk: () => handlePayOrder(order),
      // onOk: () => updateOrderStatus(order.orderId, 2, "Thanh toán thành công!"),
    });
  };

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  useEffect(() => {
    let filtered = [...orders];
    if (searchTerm.trim()) {
      const normalizedSearch = removeVietnameseTones(searchTerm.toLowerCase());
      filtered = filtered.filter((order) =>
        removeVietnameseTones(order.orderCode.toLowerCase()).includes(normalizedSearch)
      );
    }
    if (statusFilter !== null) {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }
    if (dateRange) {
      filtered = filtered.filter((order) => {
        const createdDate = new Date(order.createdDate);
        return createdDate >= new Date(dateRange[0]) && createdDate <= new Date(dateRange[1]);
      });
    }
    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, dateRange, orders]);

  const columns = [
    { title: "Mã đơn hàng", dataIndex: "orderCode", key: "orderCode" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => orderStatuses[status],
    },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Order["customer"]) => ` ${customer.lastName}`,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Phí vận chuyển (VND)",
      dataIndex: "deliveryFee",
      key: "deliveryFee",
      render: (fee: number | null) => (fee != null ? fee.toLocaleString("vi-VN") : "N/A"),
    },
    {
      title: "Tổng tiền (VND)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: Order) => {
        const totalWithDelivery = amount + (record.deliveryFee || 0);
        return totalWithDelivery.toLocaleString("vi-VN");
      },
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: Order) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                onClick={() => {
                  setSelectedOrder(record);
                  fetchOrderDetails(record.orderId);
                }}
              >
                <EyeOutlined /> Xem chi tiết
              </Menu.Item>
              {record.status === 1 && (
                <Menu.Item
                  key="payment"
                  onClick={() => showPayConfirm(record)}
                >
                  <PayCircleOutlined /> Thanh toán đơn hàng
                </Menu.Item>
              )}
              {record.status === 1 && (
                <Menu.Item key="cancel" onClick={() => showCancelConfirm(record)} danger>
                  <ExclamationCircleOutlined /> Hủy đơn hàng
                </Menu.Item>
              )}
            </Menu>
          }
          trigger={["click"]}
        >
          <Button shape="circle" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const detailColumns = [
    { title: "Tên sản phẩm", dataIndex: ["product", "productName"], key: "productName" },
    { title: "Đơn vị tính", dataIndex: ["product", "unit"], key: "unit" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Thuế (GTGT)",
      dataIndex: ["product", "vat"],
      key: "vat",
      render: (vat: number) => (vat != null ? `${vat}%` : "N/A"),
    },
    {
      title: "Đơn giá (VND)",
      dataIndex: ["product", "sellingPrice"],
      key: "sellingPrice",
      render: (price: number) => price.toLocaleString("vi-VN"),
    },
    {
      title: "Thành tiền (chưa bao gồm thuế GTGT)",
      key: "total",
      render: (record: OrderDetail) =>
        (record.quantity * record.product.sellingPrice).toLocaleString("vi-VN"),
    },
    {
      title: "Thành tiền (đã bao gồm thuế GTGT)",
      key: "totalWithTax",
      render: (record: OrderDetail) =>
        ((record.quantity * record.product.sellingPrice) * (1 + (record.product.vat || 0) / 100)).toLocaleString("vi-VN"),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Tìm kiếm theo mã đơn hàng"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
          allowClear
        />
        <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
          Lọc
        </Button>
        <Button type="primary" onClick={() => handleChangePage("Tạo đơn hàng")}>
          + Tạo đơn hàng mới
        </Button>
      </div>

      {showFilters && (
        <Collapse defaultActiveKey={["1"]}>
          <Panel header="Bộ lọc nâng cao" key="1">
            <div className="grid grid-cols-3 gap-4">
              <Select
                placeholder="Chọn trạng thái"
                value={statusFilter ?? undefined}
                onChange={(value) => setStatusFilter(value)}
                style={{ width: "100%" }}
                allowClear
              >
                {orderStatuses.map((status, index) => (
                  <Option key={index} value={index}>
                    {status}
                  </Option>
                ))}
              </Select>
              <div className="col-span-3">
                <span style={{ marginRight: 8 }}>Lọc theo ngày tạo:</span>
                <RangePicker
                  onChange={(_, dateStrings) =>
                    setDateRange(dateStrings.length === 2 ? (dateStrings as [string, string]) : null)
                  }
                  style={{ width: "100%" }}
                />
              </div>
              <div className="col-span-3">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter(null);
                    setDateRange(null);
                  }}
                  style={{ width: "100%" }}
                  danger
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </Panel>
        </Collapse>
      )}

      <Table columns={columns} dataSource={filteredOrders} rowKey="orderId" />

      {selectedOrder && (
        <Modal
          title={`Chi tiết đơn hàng: ${selectedOrder.orderCode}`}
          open={isDetailModalOpen}
          onCancel={() => setIsDetailModalOpen(false)}
          footer={null}
          width={1000}
        >
          <Table
            columns={detailColumns}
            dataSource={orderDetails}
            rowKey="orderDetailId"
            pagination={false}
          />
        </Modal>
      )}
    </div>
  );
};

export default OrderTable;