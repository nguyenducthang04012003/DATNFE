import React, { useEffect } from "react";
import { Button, Result, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

interface PaymentSuccessProps {
  handleChangePage: (page: string) => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({ handleChangePage }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    if (orderId) {
      const numericOrderId = parseInt(orderId);
      // Call API to update order status to 2 ("Đang chờ xác nhận")
      const updateOrderStatus = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.put(
            `${API_BASE_URL}/Order/UpdateOrderStatus/${numericOrderId}/2`,
            null,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.data.success) {
            message.success("Thanh toán thành công, trạng thái đơn hàng đã được cập nhật!");
          } else {
            message.error(response.data.message || "Không thể cập nhật trạng thái đơn hàng!");
          }
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
          message.error("Không thể cập nhật trạng thái đơn hàng!");
        }
      };
      updateOrderStatus();
      // Clear query params after processing
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ padding: 20, display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Result
        status="success"
        title="Thanh toán thành công!"
        subTitle="Đơn hàng của bạn đã được thanh toán. Cảm ơn bạn đã mua sắm!"
        extra={[
          <Button
            type="primary"
            key="back"
            onClick={() => handleChangePage("Danh sách đơn hàng")}
          >
            Quay lại danh sách đơn hàng
          </Button>,
        ]}
      />
    </div>
  );
};

export default PaymentSuccess;