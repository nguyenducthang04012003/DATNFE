import React, { useState, useEffect } from "react";
import {
  MoreOutlined,
  EditOutlined,
  UnorderedListOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Dropdown, Menu, Table, Button, Modal, Input, Form, Upload, message, Select } from "antd";
import { apiClient } from "../../pages/Home/AuthContext"; // Sử dụng apiClient từ AuthContext
import { useAuth } from "../../pages/Home/AuthContext"; // Sử dụng useAuth để kiểm tra xác thực

interface SubCategory {
  id: number;
  name: string;
  parentCategory: string;
  categoryMainId: number;
  code: string;
  description: string;
  createdBy: string;
  image?: string;
}

interface MainCategory {
  id: number;
  categoryName: string;
}

interface UpdateSubCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  subCategory: SubCategory | null;
  onSave: (updatedSubCategory: SubCategory) => void;
}

interface SubCategoryTableProps {
  SUBCATEGORY_DATA: SubCategory[];
  handleChangePage: (page: string, subCategoryId?: number) => void;
}

// Thành phần UpdateSubCategory
const UpdateSubCategory: React.FC<UpdateSubCategoryProps> = ({ isOpen, onClose, subCategory, onSave }) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const { user, loading } = useAuth(); // Kiểm tra trạng thái xác thực

  // Lấy danh sách danh mục chính từ API
  useEffect(() => {
    if (loading || !user) return; // Đợi xác thực hoàn tất

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
          message.error("Không thể lấy danh mục chính!");
        }
      } catch (error) {
      message.error("Lỗi khi lấy danh mục chính!");
      }
    };
    fetchMainCategories();
  }, [loading, user]);

  useEffect(() => {
    if (subCategory) {
      form.setFieldsValue({
        name: subCategory.name,
        code: subCategory.code,
        parentCategory: subCategory.parentCategory,
        description: subCategory.description,
        categoryMainId: subCategory.categoryMainId,
      });
      setPreviewImage(subCategory.image || "assets/img/product/noimage.png");
    }
  }, [subCategory, form]);

  const handleUpload = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleSave = async () => {
    if (!user) {
      message.error("Vui lòng đăng nhập để thực hiện thao tác này!");
      return;
    }

    try {
      const values = await form.validateFields();
      const formData = new FormData();
      formData.append("CategoryName", values.name);
      formData.append("CategoryCode", subCategory!.code);
      formData.append("CategoryMainId", values.categoryMainId);
      if (file) {
        formData.append("Image", file);
      }

      const response = await apiClient.put(`/Category/${subCategory?.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        const updatedSubCategory: SubCategory = {
          id: subCategory!.id,
          name: response.data.data.categoryName,
          code: response.data.data.categoryCode,
          categoryMainId: response.data.data.categoryMainId,
          parentCategory: values.parentCategory || subCategory!.parentCategory,
          description: values.description || subCategory!.description,
          createdBy: subCategory!.createdBy,
          image: response.data.data.image || subCategory!.image,
        };
        onSave(updatedSubCategory);
        message.success("Cập nhật danh mục thuốc thành công!");
        form.resetFields();
        setFile(null);
        setPreviewImage(null);
        onClose();
      } else {
        message.error("Cập nhật thất bại: " + response.data.message);
      }
    } catch (error: any) {
      message.error(error.message || "Cập nhật danh mục thuốc thất bại!");
    }
  };

  return (
    <Modal
      title="Cập nhật danh mục thuốc"
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
    >
      <Form form={form} layout="vertical">
        <Form.Item name="image" label="Ảnh">
          <Upload showUploadList={false} beforeUpload={handleUpload} accept="image/*">
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
          label="Tên danh mục thuốc"
          rules={[{ required: true, message: "Vui lòng nhập tên danh mục thuốc!" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="code"
          label="Mã danh mục thuốc"
          rules={[{ required: true, message: "Vui lòng nhập mã danh mục thuốc!" }]}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          name="categoryMainId"
          label="Chủng loại"
          rules={[{ required: true, message: "Vui lòng chọn danh mục chính!" }]}
        >
          <Select placeholder="Chọn danh mục chính">
            {mainCategories.map((cat) => (
              <Select.Option key={cat.id} value={cat.id}>
                {cat.categoryName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

// Thành phần SubCategoryTable
const SubCategoryTable: React.FC<SubCategoryTableProps> = ({ SUBCATEGORY_DATA,  }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>(SUBCATEGORY_DATA);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [selectedMainCategory, setSelectedMainCategory] = useState<number | null>(null);
  const { user, loading } = useAuth(); // Kiểm tra trạng thái xác thực

  // Lấy danh sách danh mục chính từ API
  useEffect(() => {
    if (loading || !user) return; // Đợi xác thực hoàn tất

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
          message.error("Không thể lấy danh mục chính!");
        }
      } catch (error) {
        message.error("Lỗi khi lấy danh mục chính!");
      }
    };
    fetchMainCategories();
  }, [loading, user]);

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase();
  };

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  const filterSubCategories = () => {
    let filteredSubCategories = [...SUBCATEGORY_DATA];

    if (searchTerm.trim()) {
      filteredSubCategories = filteredSubCategories.filter((subCategory) =>
        removeVietnameseTones(subCategory.name).includes(removeVietnameseTones(searchTerm))
      );
    }

    if (selectedMainCategory !== null) {
      filteredSubCategories = filteredSubCategories.filter(
        (subCategory) => subCategory.categoryMainId === selectedMainCategory
      );
    }

    setSubCategories(filteredSubCategories);
  };

  useEffect(() => {
    filterSubCategories();
  }, [searchTerm, selectedMainCategory, SUBCATEGORY_DATA]);

  const columns = [
    {
      title: "Mã danh mục",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Danh mục thuốc",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: SubCategory) => (
        <div className="flex items-center gap-3">
          <img
            src={record.image || "assets/img/product/noimage.png"}
            alt={record.name}
            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
          />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Chủng loại",
      dataIndex: "parentCategory",
      key: "parentCategory",
    },
    {
      title: <UnorderedListOutlined />,
      key: "actions",
      render: (_: any, record: SubCategory) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                onClick={() => {
                  setSelectedSubCategory(record);
                  setIsEditModalOpen(true);
                }}
              >
                <EditOutlined /> Chỉnh sửa
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button shape="circle" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Tìm kiếm theo tên danh mục thuốc"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
        />
        <Select
          placeholder="Lọc theo chủng loại"
          style={{ width: 200 }}
          allowClear
          onChange={(value) => setSelectedMainCategory(value || null)}
        >
          {mainCategories.map((cat) => (
            <Select.Option key={cat.id} value={cat.id}>
              {cat.categoryName}
            </Select.Option>
          ))}
        </Select>
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: handleRowSelectionChange,
        }}
        columns={columns}
        dataSource={subCategories}
        rowKey="id"
        pagination={{ pageSize: 5 }}
      />

      <UpdateSubCategory
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subCategory={selectedSubCategory}
        onSave={(updatedSubCategory) => {
          setSubCategories(
            subCategories.map((sub) => (sub.id === updatedSubCategory.id ? updatedSubCategory : sub))
          );
        }}
      />
    </div>
  );
};

export default SubCategoryTable;