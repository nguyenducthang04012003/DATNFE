import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiClient } from "./Home/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email || !otp || !password || !confirmPassword) {
      toast.error("Vui lòng nhập đầy đủ thông tin!", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    const cleanedOtp = otp.trim();
    if (!/^\d+$/.test(cleanedOtp)) {
      toast.error("Mã OTP chỉ được chứa số!", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Dữ liệu gửi đi:", { email, otp: cleanedOtp, password, confirmPassword });

      const response = await apiClient.post(
        "/User/ResetPassword",
        {
          email,
          otp: cleanedOtp,
          password,
          confirmPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        }
      );

      console.log("Phản hồi từ API:", response.data);

      if (
        (typeof response.data === "string" && response.data.includes("success")) ||
        (typeof response.data === "object" && response.data.success)
      ) {
        toast.success("Đặt lại mật khẩu thành công!", {
          position: "top-right",
          duration: 3000,
        });
        navigate("/");
      } else {
        toast.error(response.data || "Đặt lại mật khẩu thất bại!", {
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Lỗi đặt lại mật khẩu:", error);
      toast.error(error.response?.data || "Đặt lại mật khẩu thất bại!", {
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = () => {
    navigate("/send-otp", { state: { email } });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-white">
      <Toaster />

      {/* Phần bên trái - Form đặt lại mật khẩu */}
      <div className="lg:w-1/2 w-full flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <img src="/img/logoPharma.png" alt="Vinh Nguyen Pharmadistipro Logo" className="w-32 mb-8" />

        {/* Tiêu đề */}
        <h2 className="text-3xl font-bold text-[#00A8E8] mb-2">Đặt Lại Mật Khẩu</h2>
        <p className="text-gray-600 mb-8">
          Vui lòng nhập thông tin để đặt lại mật khẩu của bạn.
        </p>

        {/* Form */}
        <div className="w-full max-w-sm">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
              disabled={!!location.state?.email}
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Mã OTP</label>
            <input
              type="text"
              placeholder="Nhập mã OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Mật khẩu mới</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Xác nhận mật khẩu</label>
            <input
              type="password"
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
            />
          </div>

          <button
            onClick={handleResetPassword}
            className={`w-full py-3 rounded-lg font-medium text-white transition-all duration-300 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#FFCA99] hover:bg-[#FFB266]"
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Đang xử lý...
              </div>
            ) : (
              "Xác Nhận"
            )}
          </button>

          <button
            onClick={handleResendOTP}
            className="w-full text-[#00A8E8] font-medium hover:underline mt-4"
          >
            Gửi lại OTP
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full text-[#00A8E8] font-medium hover:underline mt-2"
          >
            Quay lại đăng nhập
          </button>
        </div>
      </div>

      {/* Phần bên phải - Hình minh họa */}

    </div>
  );
};

export default ResetPassword;