import { useState, useEffect, useRef } from "react";
import { Input, Select, Typography, Space } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import UserTable from "../../components/User/UserTable";
import axios from "axios";
import { useAuth } from "../Home/AuthContext";

const { Title, Text } = Typography;

interface User {
  userId: number;
  avatar: string;
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  roleId: number;
  employeeCode: string;
  createdBy: string;
  createdDate: string;
  status: boolean;
}

const UserListPage: React.FC<{ handleChangePage: (page: string) => void }> = ({
  // handleChangePage,
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const tableRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
        }

        const response = await axios.get(`${API_BASE_URL}/User/GetUserList`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*',
          },
        });

        if (response.data.success) {
          setUsers(response.data.data || []);
        } else {
          throw new Error(response.data.message || "Không thể tải danh sách người dùng!");
        }
      } catch (error: any) {
        console.error("Lỗi khi lấy danh sách người dùng:", error);
        setUsers([]);
        // const errorMessage = error.response?.data?.message || error.message || "Lỗi khi tải danh sách người dùng!";
        // Không hiển thị thông báo lỗi nếu là lỗi 401, vì AuthContext sẽ xử lý làm mới token
        if (error.response?.status !== 401) {
          // Có thể thêm thông báo lỗi bằng Ant Design message nếu cần
          // message.error(errorMessage);
        }
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.lastName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.userName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.phone || "").includes(searchTerm);
    const matchesStatus =
      !selectedStatus ||
      (selectedStatus === "Active" ? user.status : !user.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <Title level={3}>Danh sách người dùng</Title>
            <Text type="secondary">Quản lý thông tin người dùng</Text>
          </div>
          <Space>
            {/* <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleChangePage("Tạo người dùng")}
            >
              Tạo người dùng mới
            </Button> */}
          </Space>
        </div>
        <Space>
          <Input
            placeholder="Tìm kiếm người dùng..."
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="Lọc theo trạng thái"
            value={selectedStatus}
            onChange={setSelectedStatus}
            style={{ width: 150 }}
            allowClear
          >
            <Select.Option value="">Tất cả trạng thái</Select.Option>
            <Select.Option value="Active">Hoạt động</Select.Option>
            <Select.Option value="Inactive">Không hoạt động</Select.Option>
          </Select>
        </Space>
        <UserTable users={filteredUsers} setUsers={setUsers} ref={tableRef} />
      </Space>
    </div>
  );
};

export default UserListPage;