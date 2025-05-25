import React, { useState, useEffect } from "react";
import { Table, Select, Button, Modal, Collapse, Dropdown, Menu, message, Input, DatePicker } from "antd";
import { MoreOutlined, EyeOutlined, CheckOutlined, FilterOutlined, SearchOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";
import Cookies from "js-cookie";
import { useAuth } from "../../pages/Home/AuthContext";

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
  };
}

interface OrderTableProps {
  orders: Order[];
  handleChangePage: (page: string, orderId?: number) => void;
}

const OrderTableForSalesManager: React.FC<OrderTableProps> = ({ orders }) => {
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<number | null>(null);
  const [customerFilter, setCustomerFilter] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { user } = useAuth();
  const orderStatuses = ["Hủy", "Đang chờ Thanh Toán", "Đang chờ xác nhận", "Xác nhận", "Vận chuyển", "Hoàn thành"];
  const accessToken = Cookies.get("token") || localStorage.getItem("accessToken");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setFilteredOrders(orders);
  }, [orders]);

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

    if (customerFilter !== null) {
      filtered = filtered.filter((order) => order.customerId === customerFilter);
    }

    if (dateRange) {
      filtered = filtered.filter((order) => {
        const createdDate = new Date(order.createdDate);
        return createdDate >= new Date(dateRange[0]) && createdDate <= new Date(dateRange[1]);
      });
    }

    if (priceRange) {
      const [min, max] = priceRange.split("-").map(Number);
      filtered = filtered.filter((order) =>
        (isNaN(min) || order.totalAmount >= min) && (isNaN(max) || order.totalAmount <= max)
      );
    }
    filtered.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    setFilteredOrders(filtered);
  }, [searchTerm, statusFilter, customerFilter, dateRange, priceRange, orders]);

  const handleConfirmOrder = async (orderId: number) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/Order/ConfirmOrder/${orderId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.data.success) {
        message.success("Xác nhận đơn hàng thành công!");
        setFilteredOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: 3 } : order
          )
        );
      } else {
        message.error(response.data.message || "Không thể xác nhận đơn hàng!");
      }
    } catch (error: any) {
      console.error("Lỗi khi xác nhận đơn hàng:", error);
      if (error.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else {
        message.error(error.response?.data?.message || "Lỗi khi xác nhận đơn hàng!");
      }
    }
  };

  const handleCompleteOrder = async (orderId: number) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/Order/UpdateOrderStatus/${orderId}/5`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.data.success) {
        message.success("Hoàn thành đơn hàng thành công!");
        setFilteredOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: 5 } : order
          )
        );
      } else {
        message.error(response.data.message || "Không thể hoàn thành đơn hàng!");
      }
    } catch (error: any) {
      console.error("Lỗi khi hoàn thành đơn hàng:", error);
      if (error.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else {
        message.error(error.response?.data?.message || "Lỗi khi hoàn thành đơn hàng!");
      }
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/Order/UpdateOrderStatus/${orderId}/0`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 200 || response.data.success) {
        message.success("Hủy đơn hàng thành công!");
        setFilteredOrders((prev) =>
          prev.map((order) =>
            order.orderId === orderId ? { ...order, status: 0 } : order
          )
        );
      } else {
        message.error(response.data.message || "Không thể hủy đơn hàng!");
      }
    } catch (error: any) {
      console.error("Lỗi khi hủy đơn hàng:", error.response ? error.response.data : error.message);
      if (error.response?.status === 401) {
        message.error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!");
      } else if (error.response?.status === 400) {
        message.error(error.response.data.message || "Yêu cầu không hợp lệ!");
      } else if (error.response?.status === 404) {
        message.error("Không tìm thấy đơn hàng hoặc endpoint!");
      } else {
        message.error(error.response?.data?.message || "Lỗi khi hủy đơn hàng!");
      }
    }
  };

  const showCompleteModal = (orderId: number) => {
    Modal.confirm({
      title: "Hoàn thành đơn hàng",
      content: "Bạn có chắc chắn muốn hoàn thành đơn hàng này không?",
      okText: "Xác nhận hoàn thành",
      cancelText: "Hủy",
      onOk: () => handleCompleteOrder(orderId),
    });
  };

  const showCancelModal = (orderId: number) => {
    Modal.confirm({
      title: "Hủy đơn hàng",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không?",
      okText: "Xác nhận hủy",
      cancelText: "Không",
      okType: "danger",
      onOk: () => handleCancelOrder(orderId),
    });
  };

  const showConfirmModal = (orderId: number) => {
    Modal.confirm({
      title: "Xác nhận đơn hàng",
      content: "Bạn có chắc chắn muốn xác nhận đơn hàng này không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => handleConfirmOrder(orderId),
    });
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrdersDetailByOrderId/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }); 
      setOrderDetails(response.data.data || []);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      message.error("Không thể lấy chi tiết đơn hàng!");
    }
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter(null);
    setCustomerFilter(null);
    setDateRange(null);
    setPriceRange(null);
    setFilteredOrders(orders);
    message.success("Đã xóa tất cả bộ lọc!");
  };

  const uniqueCustomers = Array.from(
    new Map(orders.map((order) => [order.customerId, order.customer])).values()
  );

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
      title: "Ngày tạo đơn hàng",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Tổng tiền (VND)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number, record: Order) => {
        const deliveryFee = record.deliveryFee ?? 0;
        const totalWithDelivery = amount + deliveryFee;
        return `${totalWithDelivery.toLocaleString()} `;
      },
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: Order) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item key="view" onClick={() => { setSelectedOrder(record); fetchOrderDetails(record.orderId); }}>
                <EyeOutlined /> Xem chi tiết
              </Menu.Item>
              {record.status === 2 && user?.roleName === "SalesManager" && (
                <Menu.Item key="confirm" onClick={() => showConfirmModal(record.orderId)}>
                  <CheckOutlined /> Xác nhận
                </Menu.Item>
              )}
              {record.status === 4 && (
                <Menu.Item key="complete" onClick={() => showCompleteModal(record.orderId)}>
                  <CheckOutlined /> Hoàn thành
                </Menu.Item>
              )}
              {record.status <= 3 && user?.roleName === "SalesManager" && (
                <Menu.Item key="cancel" onClick={() => showCancelModal(record.orderId)}>
                  <CloseOutlined /> Hủy đơn hàng
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
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Thuế (%VAT)",
      dataIndex: ["product", "vat"],
      key: "vat",
      render: (vat: number) => (vat != null ? `${vat}%` : "N/A"),
    },
    {
      title: "Giá bán (VND)",
      dataIndex: ["product", "sellingPrice"],
      key: "price",
      render: (price: number) => `${price.toLocaleString()} `,
    },
    {
      title: "Tổng giá (VND)",
      key: "total",
      render: (record: OrderDetail) => `${(record.quantity * record.product.sellingPrice).toLocaleString()} `,
    },
    {
      title: "Thành tiền (bao gồm thuế) (VND)",
      key: "totalWithTax",
      render: (record: OrderDetail) => {
        const vat = record.product.vat != null && !isNaN(record.product.vat) ? record.product.vat : 0;
        const totalWithTax = record.quantity * record.product.sellingPrice * (1 + vat / 100);
        return `${totalWithTax.toLocaleString()} `;
      },
    },
    {
      title: "Chi phí giao hàng (VND)",
      key: "deliveryFee",
      render: () => {
        const deliveryFee = selectedOrder?.deliveryFee ?? 0;
        return deliveryFee != null ? `${deliveryFee.toLocaleString()} ` : "N/A";
      },
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Tìm kiếm theo mã đơn hàng"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: 200 }}
          allowClear
        />
        <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>Lọc</Button>
      </div>

      {showFilters && (
        <Collapse defaultActiveKey={["1"]}>
          <Panel header="Bộ lọc nâng cao" key="1">
            <div className="grid grid-cols-3 gap-4">
              {user?.roleName === "SalesManager" && (
                <Select
                  placeholder="Chọn trạng thái"
                  value={statusFilter ?? undefined}
                  onChange={(value) => setStatusFilter(value)}
                  style={{ width: "100%" }}
                  allowClear
                >
                  {orderStatuses.map((status, index) => (
                    <Option key={index} value={index}>{status}</Option>
                  ))}
                </Select>
              )}

              <Select
                placeholder="Chọn khách hàng"
                value={customerFilter ?? undefined}
                onChange={(value) => setCustomerFilter(value)}
                style={{ width: "100%" }}
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
                }
              >
                {uniqueCustomers.map((customer) => (
                  <Option key={customer.userId} value={customer.userId}>
                    {`${customer.firstName} ${customer.lastName}`}
                  </Option>
                ))}
              </Select>

              <Select
                placeholder="Chọn khoảng giá"
                value={priceRange ?? undefined}
                onChange={(value) => setPriceRange(value)}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value="0-100000">Dưới 100k</Option>
                <Option value="100000-500000">100k - 500k</Option>
                <Option value="0-500000">Dưới 500k</Option>
                <Option value="500000-1000000">500k - 1 triệu</Option>
                <Option value="1000000-5000000">1 triệu - 5 triệu</Option>
                <Option value="5000000-">Trên 5 triệu</Option>
              </Select>

              <div className="col-span-3">
                <span style={{ marginRight: 8 }}>Lọc theo ngày tạo:</span>
                <RangePicker
                  onChange={(_, dateStrings) => setDateRange(dateStrings.length === 2 ? dateStrings as [string, string] : null)}
                  style={{ width: "100%" }}
                />
              </div>

              <div className="col-span-3">
                <Button onClick={resetFilters} style={{ width: "100%" }} danger>
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
          width={800}
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

export default OrderTableForSalesManager;