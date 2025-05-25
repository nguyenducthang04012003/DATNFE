import React, { useState, useEffect } from "react";
import { Table, Button, Modal, message, Dropdown, Menu } from "antd";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";
import { EyeOutlined, MoreOutlined, FileAddOutlined } from "@ant-design/icons";

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
  confirmedBy: number;
  createdDate: string;
  assignTo: number;
  customer: {
    userId: number;
    userName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
  };
  confirmBy: {
    userId: number;
    userName: string;
    firstName: string;
    lastName: string;
  };
}

interface OrderDetail {
  orderDetailId: number;
  orderId: number;
  productId: number;
  quantity: number;
  totalQuantity: number | null;
  product: {
    productId: number;
    productCode: string;
    manufactureName: string;
    productName: string;
    unit: string;
    categoryId: number;
    description: string;
    sellingPrice: number;
    createdBy: number;
    createdDate: string;
    status: boolean;
    vat: number;
    storageconditions: number;
    weight: number;
    volumePerUnit: number;
  };
}

interface OrderTableProps {
  handleChangePage: (page: string, orderId?: number) => void;
}

const OrderTableForWarehouseManager: React.FC<OrderTableProps> = ({  }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrderToCreateIssueNoteList`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const filteredOrders = response.data.data.filter((order: Order) => order.assignTo === user?.customerId);
      setOrders(filteredOrders || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      message.error("Không thể lấy danh sách đơn hàng!");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrdersDetailByOrderId/${orderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "*/*",
        },
      });
      const details: OrderDetail[] = response.data.data || [];
      setOrderDetails(details);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      message.error("Không thể lấy chi tiết đơn hàng!");
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const handleCreateIssueNote = async (orderId: number) => {
    Modal.confirm({
      title: "Tạo phiếu xuất kho",
      content: "Bạn có chắc chắn muốn tạo phiếu xuất kho cho đơn hàng này không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.post(
            `${API_BASE_URL}/IssueNote/CreateIssueNote/${orderId}`,
            null,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.data) {
            message.success("Tạo phiếu xuất kho thành công!");
            setOrders((prev) => prev.filter((order) => order.orderId !== orderId));
          } else {
            message.error("Không thể tạo phiếu xuất kho!");
          }
        } catch (error: any) {
          console.error("Lỗi khi tạo phiếu xuất kho:", error);
          if (error.response?.status === 404) {
            message.error("Đơn hàng không tồn tại!");
          } else {
            message.error(error.response?.data?.message || "Lỗi khi tạo phiếu xuất kho!");
          }
        }
      },
    });
  };

  const columns = [
    { title: "Mã đơn hàng", dataIndex: "orderCode", key: "orderCode" },
    {
      title: "Khách hàng",
      dataIndex: "customer",
      key: "customer",
      render: (customer: Order["customer"]) => ` ${customer.lastName}`,
    },
    {
      title: "Người xác nhận",
      dataIndex: "confirmBy",
      key: "confirmBy",
      render: (confirmBy: Order["confirmBy"]) => `${confirmBy.firstName.trim()} ${confirmBy.lastName}`,
    },
    {
      title: "Ngày tạo",
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
        return totalWithDelivery.toLocaleString("vi-VN");
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => ["Hủy", "Đang chờ thanh toán", "Đang chờ xác nhận", "Xác nhận", "Vận chuyển", "Hoàn thành"][status],
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
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedOrder(record);
                  fetchOrderDetails(record.orderId);
                }}
              >
                Xem chi tiết
              </Menu.Item>
              <Menu.Item
                key="createIssueNote"
                icon={<FileAddOutlined />}
                onClick={() => handleCreateIssueNote(record.orderId)}
                disabled={record.status !== 3}
              >
                Tạo phiếu xuất kho
              </Menu.Item>
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
    { title: "Đơn vị tính", dataIndex: ["product", "unit"], key: "unit", render: (unit: string) => unit || "N/A" },
    { title: "Số lượng", dataIndex: "quantity", key: "quantity" },
    {
      title: "Thuế (%VAT)",
      dataIndex: ["product", "vat"],
      key: "vat",
      render: (vat: number) => (vat != null ? `${vat}%` : "N/A"),
    },
    {
      title: "Đơn giá (VND)" ,
      dataIndex: ["product", "sellingPrice"],
      key: "sellingPrice",
      render: (price: number) => price.toLocaleString("vi-VN"),
    },
    {
      title: "Thành tiền (VND)",
      key: "total",
      render: (record: OrderDetail) =>
        (record.quantity * record.product.sellingPrice).toLocaleString("vi-VN"),
    },
    {
      title: "Chi phí giao hàng (VND)",
      key: "deliveryFee",
      render: () => {
        const deliveryFee = selectedOrder?.deliveryFee ?? 0;
        return deliveryFee != null ? `${deliveryFee.toLocaleString("vi-VN")} ` : "N/A";
      },
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Danh sách đơn hàng cần tạo phiếu xuất kho</h2>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="orderId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      {selectedOrder && (
        <Modal
          title={`Chi tiết đơn hàng: ${selectedOrder.orderCode}`}
          open={isDetailModalOpen}
          onCancel={() => {
            setIsDetailModalOpen(false);
            setSelectedOrder(null);
            setOrderDetails([]);
          }}
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

export default OrderTableForWarehouseManager;