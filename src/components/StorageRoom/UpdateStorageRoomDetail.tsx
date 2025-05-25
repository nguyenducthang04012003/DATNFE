import { useEffect, useState } from "react";
import { Modal, Button, Input, Select, Form, message } from "antd";
import { X } from "lucide-react";
import axios from "axios";

const { Option } = Select;

interface StorageRoom {
  storageRoomId: number;
  storageRoomCode: string;
  storageRoomName: string;
  type: number;
  capacity: number;
  remainingRoomVolume: number;
  status: boolean;
  createdBy: number;
  createdDate: string;
}

export default function UpdateStorageRoomDetail({
  isOpen,
  onClose,
  room,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  room: StorageRoom;
  onSave: (updatedRoom: StorageRoom) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      form.setFieldsValue({
        ...room,
        status: room.status ? "1" : "0", // Convert boolean to string for Select
        type: room.type.toString(), // Convert number to string for Select
      });
    } else {
      setMounted(false);
    }
  }, [isOpen, room, form]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    const updatedRoom: StorageRoom = {
      ...room,
      storageRoomCode: values.storageRoomCode,
      storageRoomName: values.storageRoomName,
      type: Number(values.type),
      capacity: Number(values.capacity),
      remainingRoomVolume: Number(values.remainingRoomVolume),
      status: values.status === "1",
    };

    try {
      const response = await axios.put(
        `${API_BASE_URL}/StorageRoom/UpdateStorageRoom`,
        {
          storageRoomId: room.storageRoomId,
          storageRoomCode: updatedRoom.storageRoomCode,
          storageRoomName: updatedRoom.storageRoomName,
          type: updatedRoom.type,
          capacity: updatedRoom.capacity,
          remainingRoomVolume: updatedRoom.remainingRoomVolume,
          status: updatedRoom.status,
          createdBy: room.createdBy,
          createdDate: room.createdDate,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Accept": "*/*",
          },
        }
      );

      if (response.data.success) {
        message.success("Cập nhật thông tin kho hàng thành công!");
        onSave(updatedRoom);
        onClose();
      } else {
        message.error(response.data.message || "Cập nhật thất bại!");
        console.error("API Error:", response.data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Lỗi khi cập nhật kho hàng!";
        message.error(errorMessage);
        console.error("Axios Error:", error.response?.data);
      } else {
        message.error("Lỗi không xác định!");
        console.error("Unknown Error:", error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      closeIcon={<X size={20} />}
      centered
      title="Cập nhật thông tin kho hàng"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="p-4"
      >
        <Form.Item
          label="Mã kho"
          name="storageRoomCode"
          rules={[{ required: true, message: "Vui lòng nhập mã kho" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Tên kho"
          name="storageRoomName"
          rules={[{ required: true, message: "Vui lòng nhập tên kho" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Loại kho"
          name="type"
          rules={[{ required: true, message: "Vui lòng chọn loại kho" }]}
        >
          <Select>
            <Option value="1">Phòng thường</Option>
            <Option value="2">Phòng lạnh</Option>
            <Option value="3">Phòng đặc biệt</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Sức chứa"
          name="capacity"
          rules={[
            { required: true, message: "Vui lòng nhập sức chứa" },
            {
              type: "number",
              min: 0,
              message: "Sức chứa phải lớn hơn hoặc bằng 0",
              transform: (value) => Number(value),
            },
          ]}
        >
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item
          label="Thể tích còn lại"
          name="remainingRoomVolume"
          rules={[
            { required: true, message: "Vui lòng nhập thể tích còn lại" },
            {
              type: "number",
              min: 0,
              message: "Thể tích còn lại phải lớn hơn hoặc bằng 0",
              transform: (value) => Number(value),
            },
          ]}
        >
          <Input type="number" min={0} disabled /> {/* Disabled as it's likely backend-calculated */}
        </Form.Item>

        <Form.Item
          label="Trạng thái"
          name="status"
          rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
        >
          <Select>
            <Option value="1">Hoạt động</Option>
            <Option value="0">Không hoạt động</Option>
          </Select>
        </Form.Item>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={submitting}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
}