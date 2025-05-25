import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../pages/Home/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowUnauthenticated?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowUnauthenticated = false }) => {
  const { user, loading } = useAuth();

  // Nếu đang tải dữ liệu người dùng, không render gì cả (hoặc có thể hiển thị loading spinner)
  if (loading) {
    return <div>Loading...</div>; // Bạn có thể thay bằng spinner nếu muốn
  }

  // Nếu allowUnauthenticated là true, cho phép truy cập mà không cần đăng nhập
  if (allowUnauthenticated) {
    return <>{children}</>;
  }

  // Nếu không có user (chưa đăng nhập), chuyển hướng về màn đăng nhập
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Nếu đã đăng nhập, render component được bảo vệ
  return <>{children}</>;
};

export default ProtectedRoute;