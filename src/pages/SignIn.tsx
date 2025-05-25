import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, apiClient } from "./Home/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState(localStorage.getItem("lastUsername") || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const checkPaymentReturn = async () => {
    const isPaymentInProgress = localStorage.getItem("isPaymentInProgress");
    const accessToken = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId");

    if (isPaymentInProgress === "true" && accessToken && userId) {
      setLoading(true);
      try {
        // Validate token by calling /User/GetUserById
        const response = await apiClient.get(`/User/GetUserById/${userId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.data.success) {
          // Token is valid, auto-login
          await login("", "", accessToken);
          toast.success("Tự động đăng nhập thành công!", {
            position: "top-right",
            duration: 3000,
          });
          navigate("/home");
          // Clear payment-related localStorage items
          localStorage.removeItem("isPaymentInProgress");
          localStorage.removeItem("lastOrderId");
          localStorage.removeItem("lastUsername");
        } else {
          toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!", {
            position: "top-right",
            duration: 3000,
          });
        }
      } catch (error: any) {
        console.error("Lỗi khi kiểm tra token:", error.response?.status, error.response?.data);
        toast.error("Không thể tự động đăng nhập, vui lòng đăng nhập lại!", {
          position: "top-right",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    checkPaymentReturn(); // Run on component mount
  }, []);

  const handleSignIn = async () => {
    if (!username || !password) {
      toast.error("Vui lòng nhập tên đăng nhập và mật khẩu!", {
        position: "top-right",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await login(username, password);
      toast.success("Đăng nhập thành công!", {
        position: "top-right",
        duration: 3000,
      });
      navigate("/home");
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      toast.error(error.message || "Đăng nhập thất bại!", {
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
      <div className="lg:w-1/2 w-full flex flex-col items-center justify-center p-8">
        <img src="/img/logoPharma.png" alt="Vinh Nguyen Pharmadistipro Logo" className="w-32 mb-8" />
        <h2 className="text-3xl font-bold text-[#00A8E8] mb-2">Đăng Nhập</h2>
        <p className="text-gray-600 mb-8">Vui lòng đăng nhập để tiếp tục</p>
        <div className="w-full max-w-sm">
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập của bạn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A8E8] focus:border-[#00A8E8] outline-none transition-all duration-200"
            />
          </div>
          <button
            onClick={() => navigate("/send-otp")}
            className="text-[#00A8E8] font-medium hover:underline mb-6"
          >
            Quên mật khẩu?
          </button>
          <button
            onClick={handleSignIn}
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
              "Đăng Nhập"
            )}
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default SignIn;