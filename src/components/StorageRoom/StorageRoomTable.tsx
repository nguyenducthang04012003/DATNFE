import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Dropdown,
  Select,
  message,
  Form,
  Input,
  Typography,
} from "antd";
import {
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";

const { Option } = Select;
const { Title: AntTitle, Text } = Typography;

interface StorageRoom {
  storageRoomId: number;
  storageRoomCode: string | null;
  storageRoomName: string;
  type: string;
  capacity: number;
  remainingRoomVolume: number;
  status: boolean;
  createdBy: number | null;
  createdDate: string;
}

interface StorageRoomTableProps {
  storageRooms: StorageRoom[];
}

const userRoles: { [key: number]: string } = {
  1: "Giám đốc",
  2: "Quản lí kho",
  3: "Trưởng phòng kinh doanh",
  4: "Nhân viên bán hàng",
};

// Modal for Viewing Storage Room Details
const StorageRoomDetail: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  room: StorageRoom | null;
}> = ({ isOpen, onClose, room }) => {
  const [mounted, setMounted] = useState(false);
  const [fetchedRoom, setFetchedRoom] = useState<StorageRoom | null>(room);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isOpen && room?.storageRoomId) {
      setMounted(true);
      axios
        .get(
          `${API_BASE_URL}/StorageRoom/GetStorageRoomById/${room.storageRoomId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        )
        .then((response) => {
          if (response.data.success) {
            setFetchedRoom(response.data.data);
          } else {
            message.error(
              response.data.message || "Không thể tải thông tin kho!"
            );
          }
        })
        .catch((error) => {
          console.error("Lỗi khi tải thông tin kho:", error);
          message.error("Lỗi khi tải thông tin kho!");
        });
    } else {
      setMounted(false);
    }
  }, [isOpen, room]);

  if (!mounted || !fetchedRoom) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Đóng
        </Button>,
      ]}
      closeIcon={<CloseOutlined />}
      centered
      title="Thông tin kho hàng"
    >
      <div style={{ padding: 16 }}>
        <AntTitle level={5}>Xem thông tin kho hàng ở dưới đây</AntTitle>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Mã kho:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.storageRoomCode || "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tên kho:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.storageRoomName || "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Loại phòng:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.type || "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Sức chứa (cm³):</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.capacity || "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Dung tích còn lại:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.remainingRoomVolume || "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Trạng thái:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.status ? "Hoạt động" : "Không hoạt động"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Tạo bởi:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.createdBy ? userRoles[fetchedRoom.createdBy] : "N/A"}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text strong>Thời điểm tạo:</Text>
          <div style={{ padding: 8, background: "#f5f5f5", borderRadius: 4 }}>
            {fetchedRoom.createdDate || "N/A"}
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Modal for Updating Storage Room Details
const UpdateStorageRoomDetail: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  room: StorageRoom;
  onSave: (updatedRoom: StorageRoom) => void;
}> = ({ isOpen, onClose, room, onSave }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);
  const [roomTypes, setRoomTypes] = useState<{ id: string; name: string }[]>(
    []
  );

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/StorageRoom/RoomTypes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        const types = Object.entries(response.data).map(([id, name]) => ({
          id: id as string,
          name: name as string,
        }));
        setRoomTypes(types);
      } catch (error) {
        console.error("Error fetching room types:", error);
        setRoomTypes([
          { id: "1", name: "Phòng thường" },
          { id: "2", name: "Phòng lạnh" },
          { id: "3", name: "Phòng mát" },
        ]);
      }
    };

    fetchRoomTypes();

    if (isOpen) {
      setMounted(true);
      form.setFieldsValue({
        storageRoomName: room.storageRoomName,
        type: roomTypes.find((t) => t.name === room.type)?.id || room.type,
        capacity: room.capacity,
        status: room.status ? "1" : "0",
      });
    } else {
      setMounted(false);
    }
  }, [isOpen, room, form, roomTypes]);

  if (!mounted) return null;

  const handleSubmit = async (values: any) => {
    if (!user?.customerId) {
      message.error("Vui lòng đăng nhập để cập nhật kho!");
      return;
    }

    const payload = {
      storageRoomId: room.storageRoomId,
      storageRoomName: values.storageRoomName,
      type: Number(
        roomTypes.find((t) => t.name === values.type)?.id || values.type
      ),
      capacity: Number(values.capacity),
      status: values.status === "1",
      createdBy: room.createdBy || user.customerId,
      createdDate: room.createdDate,
    };

    try {
      const response = await axios.put(
        `${API_BASE_URL}/StorageRoom/UpdateStorageRoom`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        message.success("Cập nhật thông tin kho hàng thành công!");
        onSave({ ...room, ...response.data.data });
        onClose();
      } else {
        message.error(response.data.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(
          error.response?.data.message || "Có lỗi xảy ra khi cập nhật kho!"
        );
      } else {
        message.error("Lỗi không xác định!");
      }
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<CloseOutlined />}
      centered
      title="Cập nhật thông tin kho hàng"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ padding: 16 }}
      >
        <Form.Item
          label="Tên kho"
          name="storageRoomName"
          rules={[{ required: true, message: "Vui lòng nhập tên kho" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại phòng"
          name="type"
          rules={[{ required: true, message: "Vui lòng chọn loại phòng" }]}
        >
          <Select disabled>
            {roomTypes.map((type) => (
              <Option key={type.id} value={type.name}>
                {type.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Sức chứa (cm³)"
          name="capacity"
          rules={[
            { required: true, message: "Vui lòng nhập sức chứa" },
            {
              validator: async (_, value) => {
                const num = Number(value);
                if (isNaN(num) || num <= 0) {
                  return Promise.reject(new Error("Sức chứa phải lớn hơn 0"));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select disabled>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Không hoạt động</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <div style={{ textAlign: "right" }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Main StorageRoomTable Component
const StorageRoomTable: React.FC<StorageRoomTableProps> = ({
  storageRooms,
}) => {
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<StorageRoom | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rooms, setRooms] = useState<StorageRoom[]>(storageRooms);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    // Sort rooms by createdDate (newest first)
    const sortedRooms = [...storageRooms].sort((a, b) => {
      return (
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      );
    });
    setRooms(sortedRooms);
  }, [storageRooms]);

  const handleStatusChange = async (value: string, room: StorageRoom) => {
    const newStatus = value === "Hoạt động";

    Modal.confirm({
      title: "Bạn có chắc chắn muốn đổi trạng thái?",
      content: "Hành động này sẽ thay đổi trạng thái của kho.",
      okText: "Đổi trạng thái",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await axios.put(
            `${API_BASE_URL}/StorageRoom/ActivateDeactivateStorageRoom/${room.storageRoomId}/${newStatus}`,
            {},
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );
          message.success("Cập nhật trạng thái thành công!");
          setRooms((prev) =>
            prev.map((r) =>
              r.storageRoomId === room.storageRoomId
                ? { ...r, status: newStatus }
                : r
            )
          );
        } catch (error) {
          console.error("Lỗi khi cập nhật trạng thái:", error);
          message.error("Lỗi khi cập nhật trạng thái!");
        }
      },
    });
  };

  const handleSave = (updatedRoom: StorageRoom) => {
    setRooms((prev) =>
      prev.map((r) =>
        r.storageRoomId === updatedRoom.storageRoomId ? updatedRoom : r
      )
    );
    setIsEditModalOpen(false);
    setSelectedRoom(null);
  };

  const columns = [
    { title: "Mã Kho", dataIndex: "storageRoomCode", key: "storageRoomCode" },
    {
      title: "Tên kho - tên phòng",
      dataIndex: "storageRoomName",
      key: "storageRoomName",
    },
    { title: "Loại Phòng", dataIndex: "type", key: "type" },
    { title: "Dung tích(m³)", dataIndex: "capacity", key: "capacity" },
    {
      title: "Dung tích còn lại(m³)",
      dataIndex: "remainingRoomVolume",
      key: "remainingRoomVolume",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, room: StorageRoom) => {
        const statusText = status ? "Hoạt động" : "Không hoạt động";
        if (user?.roleName === "Director") {
          return (
            <Select
              value={statusText}
              onChange={(value) => handleStatusChange(value, room)}
              style={{ width: 120 }}
            >
              <Option value="Hoạt động">Hoạt động</Option>
              <Option value="Không hoạt động">Không hoạt động</Option>
            </Select>
          );
        }
        return (
          <span
            style={{
              color: status ? "#52c41a" : "#f5222d",
              fontWeight: "500",
            }}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: unknown, room: StorageRoom) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "Xem",
            onClick: () => {
              setSelectedRoom(room);
              setIsViewModalOpen(true);
            },
          },
        ];

        return (
          <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
            <Button icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  return (
    <div>
      <Table
        columns={columns}
        dataSource={rooms}
        rowKey="storageRoomId"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
      {selectedRoom && (
        <>
          <StorageRoomDetail
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedRoom(null);
            }}
            room={selectedRoom}
          />
          <UpdateStorageRoomDetail
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedRoom(null);
            }}
            room={selectedRoom}
            onSave={handleSave}
          />
        </>
      )}
    </div>
  );
};

export default StorageRoomTable;
