import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderTableForSalesManager from "../../components/Order/OrderTableForSalesManager";
import { useAuth } from "./AuthContext";
import { Result } from "antd";

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

const OrderListForSalesManager: React.FC<OrderListPageProps> = ({ handleChangePage }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Order/GetAllOrders`);
        let fetchedOrders = response.data.data || [];
        
        // Filter orders for Salesman to show only those with status 4 (Vận chuyển)
        if (user?.roleName === "SalesMan") {
          fetchedOrders = fetchedOrders.filter((order: Order) => order.status === 4);
        }
        
        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
      }
    };

    // Fetch orders if user is SalesManager or Salesman
    if (user?.roleName === "SalesManager" || user?.roleName === "SalesMan") {
      fetchOrders();
    }
  }, [user]);

  // If user is not SalesManager or Salesman, show access denied
  if (!user || (user.roleName !== "SalesManager" && user.roleName !== "SalesMan")) {
    return (
      <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
        <Result
          status="403"
          title="403"
          subTitle="Xin lỗi, bạn không có quyền truy cập trang này."
        />
      </div>
    );
  }

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {user.roleName === "SalesMan" ? "Danh sách đơn hàng (Salesman)" : "Danh sách đơn hàng (Sales Manager)"}
          </h1>
          <p className="text-sm text-gray-500">Quản lý đơn hàng của bạn</p>
        </div>
      </div>

      <OrderTableForSalesManager orders={orders} handleChangePage={handleChangePage} />
    </div>
  );
};

export default OrderListForSalesManager;