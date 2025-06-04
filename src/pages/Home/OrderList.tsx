// src/pages/OrderListPage.tsx
import React, { useState, useEffect } from "react";
import OrderTable from "../../components/Order/OrderTable";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext"; // Import AuthContext để lấy thông tin người dùng
import { Result } from "antd"; // Thêm Result để hiển thị thông báo khi không có quyền

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

interface OrderListPageProps {
  handleChangePage: (page: string, orderId?: number) => void;
}

const OrderListPage: React.FC<OrderListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.customerId || user.roleName !== "Customer") return; // Chỉ gọi API nếu là Customer
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${API_BASE_URL}/Order/GetOrderByCustomerId?customerId=${user.customerId}`,
          {
            headers: { Authorization: `Bearer ${token}`, "ngrok-skip-browser-warning": "true", },
          }
        );
        setOrders(response.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      }
    };

    fetchOrders();
  }, [user]);

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) => (order.orderId === updatedOrder.orderId ? updatedOrder : order))
    );
  };

  // Kiểm tra vai trò và chỉ hiển thị nội dung cho Customer
  if (!user || user.roleName !== "Customer") {
    return (
      <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này. Trang này chỉ dành cho khách hàng."
        />
      </div>
    );
  }

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách đơn hàng</h1>
          <p className="text-sm text-gray-500">Quản lý đơn hàng của bạn</p>
        </div>
      </div>

      <OrderTable orders={orders} handleChangePage={handleChangePage} onUpdate={handleUpdateOrder} />
    </div>
  );
};

export default OrderListPage;