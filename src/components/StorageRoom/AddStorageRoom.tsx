import { useState } from "react";
import { Button, Input, Select, Form, Space, message } from "antd";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext"; // Import useAuth to access user info

interface StorageRoom {
  storageRoomName: string;
  status: boolean;
  capacity: number;
  type: number;
}

export default function AddStorageRoom() {
  const { user } = useAuth(); // Get authenticated user
  const [, setStorageRooms] = useState<StorageRoom[]>([]);
  const [newStorageRoom, setNewStorageRoom] = useState<Partial<StorageRoom>>({
    storageRoomName: "",
    status: true, // Default to true as per API
    capacity: 0,
    type: 1, // Default to 1 as per API
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleChange = (name: string, value: any) => {
    setNewStorageRoom((prev) => ({
      ...prev,
      [name]: name === "status" ? value === "1" : name === "type" || name === "capacity" ? parseInt(value) : value,
    }));
  };

  const handleAddStorageRoom = async () => {
    if (!newStorageRoom.storageRoomName || !newStorageRoom.capacity || !newStorageRoom.type) {
      message.warning("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    if (!user?.customerId) {
      message.error("Vui lòng đăng nhập để tạo kho!");
      return;
    }

    const formData = new FormData();
    formData.append("StorageRoomName", newStorageRoom.storageRoomName);
    formData.append("Status", newStorageRoom.status ? "true" : "false");
    formData.append("Capacity", newStorageRoom.capacity.toString());
    formData.append("Type", newStorageRoom.type.toString());
    formData.append("CreatedBy", user.customerId.toString());

    try {
      const response = await axios.post(
        `${API_BASE_URL}/StorageRoom/CreateStorageRoom`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        message.success("Tạo kho thành công!");
        setStorageRooms((prev) => [
          ...prev,
          {
            storageRoomId: response.data.data.storageRoomId, // Use ID from response
            ...newStorageRoom,
          } as StorageRoom,
        ]);
        setNewStorageRoom({ storageRoomName: "", status: true, capacity: 0, type: 1 });
      } else {
        message.error(response.data.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data.message || "Có lỗi xảy ra!");
      } else {
        message.error("Lỗi không xác định!");
      }
    }
  };

  return (
    <div style={{ padding: "24px", background: "#fafbfe", borderRadius: "8px", marginTop: "60px" }}>
      <p>Tạo kho hàng mới</p>
      <Form layout="vertical" onFinish={handleAddStorageRoom}>
        <Space direction="vertical" style={{ display: "flex" }}>
          <Form.Item label="Tên kho" required>
            <Input
              placeholder="Nhập tên kho"
              value={newStorageRoom.storageRoomName}
              onChange={(e) => handleChange("storageRoomName", e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Trạng thái"
            name="status"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
          >
            <Select
              placeholder="Tùy chỉnh trạng thái"
              value={newStorageRoom.status ? "1" : "0"}
              onChange={(value) => handleChange("status", value)}
            >
              <Select.Option value="1">Hoạt động</Select.Option>
              <Select.Option value="0">Không hoạt động</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Sức chứa" required>
            <Input
              type="number"
              placeholder="Nhập sức chứa"
              value={newStorageRoom.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
            />
          </Form.Item>

          <Form.Item
            label="Loại kho"
            name="type"
            rules={[{ required: true, message: "Vui lòng chọn loại kho!" }]}
          >
            <Select
              placeholder="Chọn loại kho"
              value={newStorageRoom.type}
              onChange={(value) => handleChange("type", value)}
            >
              <Select.Option value={1}>Phòng thường (Nhiệt độ: 15-30°C, &lt;75%)</Select.Option>
              <Select.Option value={2}>Phòng lạnh (Nhiệt độ: 2-8°C, &lt;45%)</Select.Option>
              <Select.Option value={3}>Phòng mát (Nhiệt độ: 8-15°C, &lt;70%)</Select.Option>
            </Select>
          </Form.Item>

          <Space>
            <Button type="primary" onClick={handleAddStorageRoom}>
              Tạo kho
            </Button>
            <Button
              onClick={() => setNewStorageRoom({ storageRoomName: "", status: true, capacity: 0, type: 1 })}
            >
              Hủy
            </Button>
          </Space>
        </Space>
      </Form>
    </div>
  );
}