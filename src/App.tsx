import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import SendOTP from "./pages/SendOTP";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider } from "./pages/Home/AuthContext";
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailed from './pages/Payment/PaymentFailed';
import Profile from './pages/Home/Profile'; // Import Profile component
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const handleChangePage = (page: string, orderId?: number) => {
    console.log("handleChangePage called:", { page, orderId });
    if (page === "Danh sách đơn hàng") {
      window.location.href = "/";
    } else if (page === "Tạo đơn hàng") {
      window.location.href = "/";
    }
  };

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Tuyến đường công khai - không cần bảo vệ */}
          <Route path="/" element={<SignIn />} />

          {/* Tuyến đường cho phép truy cập mà không cần đăng nhập */}
          <Route
            path="/send-otp"
            element={
              <ProtectedRoute allowUnauthenticated>
                <SendOTP />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <ProtectedRoute allowUnauthenticated>
                <ResetPassword />
              </ProtectedRoute>
            }
          />

          {/* Các tuyến đường được bảo vệ - yêu cầu đăng nhập */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/success"
            element={
              <ProtectedRoute>
                <PaymentSuccess handleChangePage={handleChangePage} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/failed"
            element={
              <ProtectedRoute>
                <PaymentFailed handleChangePage={handleChangePage} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;