import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Upload, Button, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { apiClient } from "../../pages/Home/AuthContext"; // Sử dụng apiClient từ AuthContext
import { useAuth } from "../../pages/Home/AuthContext"; // Sử dụng useAuth để kiểm tra xác thực

interface Category {
  id: number;
  name: string;
  code: string;
  createdBy: string;
  image?: string;
}

interface UpdateCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (updatedCategory: Category) => void;
}

const UpdateCategory: React.FC<UpdateCategoryProps> = ({
  isOpen,
  onClose,
  category,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null); // Lưu file ảnh để gửi API
  const [isSaving, setIsSaving] = useState(false); // Trạng thái loading khi lưu
  const { user, loading } = useAuth(); // Kiểm tra trạng thái xác thực

  // Khởi tạo form và preview ảnh khi category thay đổi
  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name,
        code: category.code,
      });
      setPreviewImage(category.image || "assets/img/product/noimage.png");
    } else {
      form.resetFields();
      setPreviewImage(null);
      setFile(null);
    }
  }, [category, form]);

  // Xử lý upload ảnh
  const handleUpload = (file: File) => {
    setFile(file); // Lưu file để gửi API
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false; // Ngăn không tải lên server trực tiếp
  };

  // Xử lý lưu danh mục
  const handleSave = async () => {
    if (loading || !user) {
      message.error("Vui lòng đăng nhập để thực hiện thao tác này!");
      return;
    }

    if (!category) {
      message.error("Không có danh mục để cập nhật!");
      return;
    }

    try {
      setIsSaving(true);
      const values = await form.validateFields();

      // Tạo FormData để gửi yêu cầu API
      const formData = new FormData();
      formData.append("CategoryName", values.name);
      formData.append("CategoryCode", values.code);
      if (file) {
        formData.append("Image", file);
      }

      // Gửi yêu cầu API để cập nhật danh mục
      const response = await apiClient.put(`/Category/${category.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const updatedCategory: Category = {
          id: category.id,
          name: response.data.data.categoryName || values.name,
          code: response.data.data.categoryCode || values.code,
          createdBy: category.createdBy,
          image: response.data.data.image || category.image,
        };

        onSave(updatedCategory); // Gọi callback để cập nhật state bên ngoài
        message.success("Cập nhật loại sản phẩm thành công!");
        form.resetFields();
        setFile(null);
        setPreviewImage(null);
        onClose();
      } else {
        message.error("Cập nhật thất bại: " + response.data.message);
      }
    } catch (error: any) {
      message.error(error.message || "Cập nhật loại sản phẩm thất bại!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title="Cập nhật loại sản phẩm"
      open={isOpen}
      onCancel={() => {
        form.resetFields();
        setFile(null);
        setPreviewImage(null);
        onClose();
      }}
      onOk={handleSave}
      okText="Lưu"
      cancelText="Hủy"
      okButtonProps={{ loading: isSaving }} // Hiển thị trạng thái loading
    >
      <Form form={form} layout="vertical">
        {/* Upload ảnh */}
        <Form.Item name="image" label="Ảnh">
          <Upload
            showUploadList={false}
            beforeUpload={handleUpload}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-32 h-32 mt-2 object-cover border rounded-md"
            />
          )}
        </Form.Item>

        <Form.Item
          name="name"
          label="Tên loại sản phẩm"
          rules={[{ required: true, message: "Vui lòng nhập tên loại sản phẩm!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã"
          rules={[{ required: true, message: "Vui lòng nhập mã!" }]}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default React.memo(UpdateCategory); // Tối ưu hóa render