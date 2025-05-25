import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "./Home/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const SendOTP: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      toast.error("Vui lòng nhập email!", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Email gửi đi:", email);

      const response = await apiClient.post(
        "/User/SentOTP",
        `"${email}"`,
        {
          headers: {
            "Content-Type": "application/json",
            accept: "*/*",
          },
        }
      );
console.log("", response.data.OTP)
      console.log("Phản hồi từ API:", response.data);

      if (typeof response.data === "string" && response.data.includes("OTP sent successfully")) {
        toast.success("Mã OTP đã được gửi đến email của bạn!", {
          
          position: "top-right",
          duration: 3000,
        });
        navigate("/reset-password", { state: { email } });
      } else {
        toast.error(response.data || "Gửi OTP thất bại!", {
          position: "top-right",
          duration: 3000,
        });
      }
    } catch (error: any) {
      console.error("Lỗi gửi OTP:", error);
      toast.error(error.response?.data || "Gửi OTP thất bại!", {
        position: "top-right",
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row items-center justify-center bg-white">
      <Toaster />

      {/* Phần bên trái - Form gửi OTP */}
      <div className="lg:w-1/2 w-full flex flex-col items-center justify-center p-8">
        {/* Logo */}
        <img src="/img/logoPharma.png" alt="Vinh Nguyen Pharmadistipro Logo" className="w-32 mb-8" />

        {/* Tiêu đề */}
        <h2 className="text-3xl font-bold text-[#00A8E8] mb-2">Quên Mật Khẩu?</h2>
        <p className="text-gray-600 mb-8">
          Đừng lo! Vui lòng nhập email liên kết với tài khoản của bạn.
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
            />
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-[#00A8E8] font-medium hover:underline mb-6 "
          >
            Quay về đăng nhập
          </button>

          <button
            onClick={handleSendOTP}
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
                  xmlns="https://www.w3.org/2000/svg"
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
              "Gửi"
            )}
          </button>
        </div>
      </div>


    </div>
  );
};

export default SendOTP;