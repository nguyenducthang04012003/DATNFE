// src/pages/OrderListForWarehouseManager.tsx
import React from "react";
import OrderTableForWarehouseManager from "../../components/Order/OrderTableForWarehouseManager";
import { useAuth } from "../Home/AuthContext"; // Import AuthContext để lấy thông tin người dùng
import { Result } from "antd";

interface OrderListPageProps {
  handleChangePage: (page: string, orderId?: number) => void;
}

const OrderListForWarehouseManager: React.FC<OrderListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();

  // Chỉ cho phép Warehouse Manager (giả sử roleId = 4) truy cập
  if (!user || user.roleName !== "WarehouseManager") {
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
          <h1 className="text-xl font-semibold text-gray-900">Danh sách đơn hàng (Warehouse Manager)</h1>
          <p className="text-sm text-gray-500">Quản lý đơn hàng để tạo phiếu xuất kho</p>
        </div>
      </div>
      <OrderTableForWarehouseManager handleChangePage={handleChangePage} />
    </div>
  );
};

export default OrderListForWarehouseManager;