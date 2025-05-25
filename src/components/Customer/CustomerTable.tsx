import { useState, forwardRef } from "react";
import { Table, Modal, message, Select, Dropdown, Button, Menu, Avatar } from "antd";
import { EyeOutlined,   MoreOutlined } from "@ant-design/icons";
import CustomerDetailsModal from "./CustomerDetail";
import UpdateCustomerDetailsModal from "./UpdateCustomerDetail";
import axios from "axios";

interface Customer {
  userId: number;
  avatar: string;
  lastName: string;
  employeeCode: string;
  email: string;
  phone: string;
  address: string;
  age: number;
  createdBy: string;
  createdDate: string;
  taxCode: number;
  status: boolean;
}

interface CustomerTableProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
}

// Use forwardRef to pass the ref to the component
const CustomerTable = forwardRef<HTMLDivElement, CustomerTableProps>(({ customers, setCustomers }, ref) => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // const handleDelete = (customer: Customer) => {
  //   Modal.confirm({
  //     title: "Xác nhận xóa",
  //     content: "Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.",
  //     okText: "Xóa",
  //     okType: "danger",
  //     cancelText: "Hủy",
  //     onOk: async () => {
  //       try {
  //         await axios.delete(`http://pharmadistiprobe.fun/api/Customer/DeleteCustomer/${customer.userId}`);
  //         setCustomers(customers.filter((item) => item.userId !== customer.userId));
  //         message.success("Xóa khách hàng thành công!");
  //       } catch (error) {
  //         console.error("Error deleting customer:", error);
  //         message.error("Lỗi khi xóa khách hàng!");
  //       }
  //     },
  //   });
  // };

  const handleStatusChange = async (value: string, record: Customer) => {
    const newStatus = value === "Hoạt động";
    Modal.confirm({
      title: "Xác nhận thay đổi trạng thái",
      content: "Bạn có chắc chắn muốn thay đổi trạng thái của khách hàng này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/User/ActivateDeactivateUser/${record.userId}/${newStatus}`
          );
          setCustomers(
            customers.map((item) =>
              item.userId === record.userId ? { ...item, status: newStatus } : item
            )
          );
          message.success("Cập nhật trạng thái thành công!");
        } catch (error) {
          console.error("Error updating status:", error);
          // message.error("Lỗi khi cập nhật trạng thái!");
        }
      },
    });
  };

  const columns = [
    // { title: "ID", dataIndex: "userId", key: "userId" },
    { title: "Tên khách hàng", dataIndex: "lastName", key: "lastName" },
    {
      title: "Ảnh đại diện",
      dataIndex: "avatar",
      key: "avatar",
      render: (avatar: string) => (
        <Avatar src={avatar} size={40} shape="square" />
      ),
    },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: Customer) => (
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
      render: (_: any, record: Customer) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedCustomer(record);
                  setIsViewModalOpen(true);
                }}
              >
                Xem
              </Menu.Item>
              {/* <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedCustomer(record);
                  setIsEditModalOpen(true);
                }}
              >
                Chỉnh sửa
              </Menu.Item> */}
              {/* <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={() => handleDelete(record)}
              >
                Xóa
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
        dataSource={customers}
        rowKey="userId"
        pagination={{ pageSize: 10 }}
        bordered
      />
      <CustomerDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        customer={selectedCustomer}
      />
      <UpdateCustomerDetailsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        customer={selectedCustomer}
        onSave={(updatedCustomer) => {
          setCustomers(
            customers.map((item) =>
              item.userId === updatedCustomer.userId ? updatedCustomer : item
            )
          );
        }}
      />
    </div>
  );
});

export default CustomerTable;