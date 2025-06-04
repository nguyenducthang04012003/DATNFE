import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
  customerId: number;
  username: string;
  address: string;
  avatar?: string | undefined;
  roleName?: string | undefined;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    username?: string,
    password?: string,
    token?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const apiClient = axios.create({
  baseURL:
    // "https://7e56-2402-800-6205-2fb2-7843-311f-f334-3e7c.ngrok-free.app/api",
    "https://pharmadistiprobe.fun/api",
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = Cookies.get("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("Không có refresh token");
      }

      const response = await apiClient.post("/User/RefreshToken", {
        refreshToken,
      });

      if (response.status === 200) {
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);
        Cookies.set("token", accessToken, { expires: 7 });

        return accessToken;
      } else {
        throw new Error("Phản hồi không hợp lệ từ server khi refresh token");
      }
    } catch (error: any) {
      console.error("Refresh token failed:", error);
      logout();
      throw error;
    }
  };

  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const newAccessToken = await refreshAccessToken();
            originalRequest.headers[
              "Authorization"
            ] = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (
    username?: string,
    password?: string,
    token?: string
  ) => {
    try {
      if (token) {
        // Auto-login with stored token
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName");
        const roleName = localStorage.getItem("roleName") ?? undefined;
        const userAvatar = localStorage.getItem("userAvatar") ?? undefined;

        if (!userId || !userName) {
          throw new Error(
            "Thông tin người dùng không đầy đủ trong localStorage"
          );
        }

        const profileResponse = await apiClient.get(
          `/User/GetUserById/${userId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const userData: User = {
          customerId: parseInt(userId),
          username: userName,
          address: profileResponse.data.data.address || "Chưa có địa chỉ",
          avatar: userAvatar,
          roleName: roleName,
        };

        setUser(userData);
        Cookies.set("user", JSON.stringify(userData), { expires: 7 });
        Cookies.set("token", token, { expires: 7 });
        localStorage.setItem("accessToken", token);
        return;
      }

      if (!username || !password) {
        throw new Error("Vui lòng cung cấp tên đăng nhập và mật khẩu");
      }

      const loginResponse = await apiClient.post("/User/Login", {
        userName: username,
        password,
      });

      if (loginResponse.status === 200) {
        const {
          accessToken,
          refreshToken,
          userId,
          roleName,
          userName,
          userAvatar,
        } = loginResponse.data.data;

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("userId", userId.toString());
        localStorage.setItem("roleName", roleName ?? "");
        localStorage.setItem("userName", userName);
        localStorage.setItem("userAvatar", userAvatar ?? "");

        const profileResponse = await apiClient.get(
          `/User/GetUserById/${userId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        const userData: User = {
          customerId: userId,
          username: userName,
          address: profileResponse.data.data.address || "Chưa có địa chỉ",
          avatar: userAvatar,
          roleName: roleName,
        };

        setUser(userData);
        Cookies.set("user", JSON.stringify(userData), { expires: 7 });
        Cookies.set("token", accessToken, { expires: 7 });
      } else {
        throw new Error("Phản hồi không hợp lệ từ server!");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.response?.status === 404) {
        throw new Error(
          "Đăng nhập thất bại. Tên đăng nhập hoặc mật khẩu không đúng!"
        );
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Đăng nhập thất bại. Vui lòng thử lại!");
      }
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("user");
    Cookies.remove("token");
    Cookies.remove("cart");
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { apiClient };
