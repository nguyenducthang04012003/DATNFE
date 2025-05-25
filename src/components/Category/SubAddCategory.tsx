import React, { useState, useEffect } from "react";
import { Form, Input, Select, Upload, Button, Typography, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { apiClient } from "../../pages/Home/AuthContext"; // Sử dụng apiClient từ AuthContext
import { useAuth } from "../../pages/Home/AuthContext";

const { Title, Text } = Typography;
const { Option } = Select;

interface MainCategory {
  id: number;
  categoryName: string;
}

const SubAddCategory: React.FC<{ handleChangePage: (page: string) => void }> = ({ handleChangePage }) => {
  const { user, loading: authLoading } = useAuth();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách danh mục chính từ API
  useEffect(() => {
    if (authLoading || !user) return;

    const fetchMainCategories = async () => {
      try {
        const response = await apiClient.get("/Category/tree", {
          headers: { Accept: "*/*" },
        });
        if (response.data.success) {
          const categories = response.data.data.map((cat: any) => ({
            id: cat.id,
            categoryName: cat.categoryName,
          }));
          setMainCategories(categories);
        } else {
          message.error("Không thể lấy danh mục chính: " + response.data.message);
        }
      } catch (error: any) {
        message.error(error.message || "Lỗi khi lấy danh mục chính!");
      }
    };
    fetchMainCategories();
  }, [authLoading, user]);

  // Xử lý submit form
  const handleSubmit = async (values: any) => {
    if (!user || !user.customerId) {
      message.error("Vui lòng đăng nhập để thực hiện thao tác này!");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("CategoryName", values.categoryName);
      formData.append("CategoryMainId", values.parentCategory.toString());
      formData.append("CreatedBy", user.customerId.toString());
      if (fileList[0]) {
        formData.append("Image", fileList[0].originFileObj);
      }

      const response = await apiClient.post("/Category", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "*/*",
        },
      });

      if (response.data.success) {
        message.success("Danh mục thuốc đã được thêm thành công!");
        form.resetFields();
        setFileList([]);
        setPreviewImage(null);
        handleChangePage("Danh sách danh mục thuốc");
      } else {
        message.error("Tạo danh mục thuốc thất bại: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Failed to create category:", error);
      message.error(error.response?.data?.message || error.message || "Tạo danh mục thuốc thất bại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xử lý hủy
  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setPreviewImage(null);
    handleChangePage("Danh sách danh mục thuốc");
  };

  // Xử lý thay đổi ảnh
  const handleImageChange = ({ file }: any) => {
    const isImage = file.type.startsWith("image/");
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isImage) {
      message.error("Chỉ được chọn tệp hình ảnh (PNG, JPG, JPEG, GIF)!");
      return;
    }
    if (!isLt10M) {
      message.error("Ảnh phải nhỏ hơn 10MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setFileList([{ ...file, originFileObj: file }]);
  };

  // Không render nếu chưa xác thực
  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="p-6 mt-[60px] w-full bg-[#f8f9fc]">
      <div className="w-[80%]">
        <Title level={2}>Tạo danh mục thuốc</Title>
        <Text type="secondary" className="block mb-5">
          Tạo danh mục thuốc mới
        </Text>

        <Form form={form} layout="vertical" onFinish={handleSubmit} className="w-full">
          {/* Danh mục hệ thống */}
          <Form.Item
            label="Chủng loại"
            name="parentCategory"
            rules={[{ required: true, message: "Vui lòng chọn chủng loại!" }]}
          >
            <Select placeholder="Chọn chủng loại">
              {mainCategories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.categoryName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {/* Tên danh mục */}
          <Form.Item
            label="Tên danh mục"
            name="categoryName"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục!" }]}
          >
            <Input placeholder="Nhập tên danh mục" />
          </Form.Item>

          {/* Ảnh danh mục */}
          <Form.Item label="Ảnh danh mục">
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
              <div className="mt-3 flex justify-center">
                <img src={previewImage} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow" />
              </div>
            )}
            <Text type="secondary">Hỗ trợ định dạng PNG, JPG, GIF (tối đa 10MB)</Text>
          </Form.Item>

          {/* Nút lưu & hủy */}
          <div className="flex gap-4">
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Lưu
            </Button>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              Hủy
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default SubAddCategory;