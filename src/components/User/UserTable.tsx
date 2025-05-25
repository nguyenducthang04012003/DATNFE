import { useState, forwardRef } from "react";
import { Table, Modal, message, Select, Dropdown, Button, Menu, Avatar } from "antd";
import { EyeOutlined,  MoreOutlined } from "@ant-design/icons";
import UserDetailsModal from "./UserDetail";
import UpdateUserDetailsModal from "./UpdateUserDetail";
import axios from "axios";

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

interface UserTableProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const UserTable = forwardRef<HTMLDivElement, UserTableProps>(({ users, setUsers }, ref) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleStatusChange = async (value: string, record: User) => {
    const newStatus = value === "Hoạt động";
    Modal.confirm({
      title: "Xác nhận thay đổi trạng thái",
      content: "Bạn có chắc chắn muốn thay đổi trạng thái của người dùng này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/User/ActivateDeactivateUser/${record.userId}/${newStatus}`
          );
          setUsers(
            users.map((item) =>
              item.userId === record.userId ? { ...item, status: newStatus } : item
            )
          );
          message.success("Cập nhật trạng thái thành công!");
        } catch (error) {
          console.error("Error updating status:", error);
          message.error("Lỗi khi cập nhật trạng thái!");
        }
      },
    });
  };

  const columns = [
    // { title: "ID", dataIndex: "userId", key: "userId" },
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) => (
        <Avatar src={avatar} size={40} shape="square" />
      ),
    },
    { title: "Tên người dùng", dataIndex: "userName", key: "userName" },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: User) => (
        <Select
          value={status ? "Hoạt động" : "Không hoạt động"}
          onChange={(value) => handleStatusChange(value, record)}
          style={{ width: 120 }}
        >
          <Select.Option value="Hoạt động">Hoạt động</Select.Option>
          <Select.Option value="Không hoạt động">Không hoạt động</Select.Option>
        </Select>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: User) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedUser(record);
                  setIsViewModalOpen(true);
                }}
              >
                Xem
              </Menu.Item>
              {/* <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedUser(record);
                  setIsEditModalOpen(true);
                }}
              >
                Chỉnh sửa
              </Menu.Item> */}
            </Menu>
          }
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div ref={ref}>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="userId"
        pagination={{ pageSize: 10 }}
        bordered
      />
      <UserDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
      />
      <UpdateUserDetailsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={selectedUser}
        onSave={(updatedUser) => {
          setUsers(
            users.map((item) =>
              item.userId === updatedUser.userId ? updatedUser : item
            )
          );
        }}
      />
    </div>
  );
});

export default UserTable;