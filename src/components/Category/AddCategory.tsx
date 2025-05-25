import React, { useState } from "react";
import { Form, Input, Upload, Button, Card, Typography, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext"; // Điều chỉnh đường dẫn nếu cần

const { Title, Text } = Typography;

interface AddCategoryProps {
  handleChangePage: (page: string) => void;
}

const AddCategory: React.FC<AddCategoryProps> = ({ handleChangePage }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const { user } = useAuth();

  const handleSubmit = async (values: any) => {
    if (!user) {
      message.error("Vui lòng đăng nhập để tạo chủng loại!");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const formData = new FormData();
      formData.append("CategoryName", values.categoryName);
      if (fileList.length > 0) {
        formData.append("Image", fileList[0]);
      }

      console.log("Sending POST request with FormData:", {
        CategoryName: values.categoryName,
        Image: fileList.length > 0 ? fileList[0].name : "Không có ảnh",
      }); // Debug: Xem dữ liệu gửi đi

      const response = await axios.post(`${API_BASE_URL}/Category`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API response:", response.data); // Debug: Xem phản hồi API

      if (response.data.success) {
        message.success("Chủng loại đã được thêm thành công!");
        form.resetFields();
        setFileList([]);
        setPreviewImage(null);
        handleChangePage("Chủng loại");
      } else {
        message.error("Tạo chủng loại thất bại: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Lỗi khi tạo chủng loại:", error);
      // message.error(error.message || 'Tạo chủng loại thất bại! Vui lòng thử lại.');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setPreviewImage(null);
    handleChangePage("Chủng loại");
  };

  const handleImageChange = ({ file }: any) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFileList([file]);
  };

  return (
    <div className="p-6 mt-[60px] w-full bg-[#f8f9fc]">
      <Title level={2}>Tạo chủng loại</Title>
      <Text type="secondary">Tạo chủng loại mới</Text>

      <Card className="mt-5">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Tên chủng loại"
            name="categoryName"
            rules={[
              { required: true, message: "Vui lòng nhập tên chủng loại!" },
            ]}
          >
            <Input placeholder="Nhập tên chủng loại" />
          </Form.Item>

          <Form.Item label="Ảnh">
            <Upload
              beforeUpload={(file) => {
                handleImageChange({ file });
                return false;
              }}
              onRemove={() => {
                setFileList([]);
                setPreviewImage(null);
              }}
              fileList={fileList}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            {previewImage && (
              <div className="mt-3">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg shadow"
                />
              </div>
            )}
            <Text type="secondary">
              Hỗ trợ định dạng PNG, JPG, GIF (tối đa 10MB)
            </Text>
          </Form.Item>

          <div className="flex gap-4">
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
            <Button onClick={handleCancel}>Hủy</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AddCategory;
