import React, { useState, useEffect } from 'react';
import {
  MoreOutlined,
  EditOutlined,
  UnorderedListOutlined,
  // FileExcelOutlined,
  // PrinterOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Table, Button, Modal, Input, Form, Upload, message } from 'antd';
// import * as XLSX from 'xlsx';
import axios from 'axios';
import { useAuth } from '../../pages/Home/AuthContext'; // Giả sử cần token để gọi API  

interface Category {
  id: number;
  name: string;
  code: string;
  createdBy: string;
  image?: string;
}

interface CategoryTableProps {
  CATEGORY_DATA: Category[];
  handleChangePage: (page: string, categoryId?: number) => void;
}

interface UpdateCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSave: (updatedCategory: Category) => void;
}

// UpdateCategory Component
const UpdateCategory: React.FC<UpdateCategoryProps> = ({ isOpen, onClose, category, onSave }) => {
  const [form] = Form.useForm();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  useEffect(() => {
    if (category) {
      form.setFieldsValue({
        name: category.name,
        code: category.code,
      });
      setPreviewImage(category.image || 'assets/img/product/noimage.png');
    }
  }, [category, form]);

  const handleUpload = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    return false; // Ngăn tải lên server
  };

  const handleSave = async () => {
    if (!user) {
      message.error('Vui lòng đăng nhập để chỉnh sửa chủng loại!');
      return;
    }

    try {
      const values = await form.validateFields();
      console.log('Form values:', values); // Debug: Xem giá trị form

      const formData = new FormData();
      formData.append('CategoryName', values.name);
      formData.append('CategoryCode', category!.code); // Giữ nguyên mã gốc
      if (file) {
        formData.append('Image', file);
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
      }

      console.log('Sending PUT request with FormData:', {
        CategoryName: values.name,
        CategoryCode: category!.code,
        Image: file ? file.name : 'Không có ảnh',
      }); // Debug: Xem dữ liệu gửi đi

      const response = await axios.put(
        `${API_BASE_URL}/Category/${category?.id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log('API response:', response.data); // Debug: Xem phản hồi API

      if (response.data.success) {
        const updatedCategory: Category = {
          id: category!.id,
          name: response.data.data.categoryName,
          code: response.data.data.categoryCode,
          image: response.data.data.image,
          createdBy: user.username,
        };
        onSave(updatedCategory);
        message.success('Cập nhật chủng loại thành công!');
        form.resetFields();
        setFile(null);
        setPreviewImage(null);
        onClose();
      } else {
        message.error('Cập nhật thất bại: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật chủng loại:', error); // Debug: Ghi log lỗ
      // message.error(error.message || 'Cập nhật chủng loại thất bại! Vui lòng thử lại.');
    }
  };

  return (
    <Modal
      title="Cập nhật chủng loại"
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
          label="Tên chủng loại"
          rules={[{ required: true, message: 'Vui lòng nhập tên chủng loại!' }]}
        >
          <Input />
        </Form.Item>

        {/* <Form.Item
          name="code"
          label="Mã chủng loại"
          rules={[{ required: true, message: 'Mã chủng loại không được để trống!' }]}
        >
          <Input disabled />
        </Form.Item> */}
      </Form>
    </Modal>
  );
};

// CategoryTable Component
const CategoryTable: React.FC<CategoryTableProps> = ({ CATEGORY_DATA,  }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>(CATEGORY_DATA);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  };

  // const showDeleteConfirm = (category: Category) => {
  //   Modal.confirm({
  //     title: 'Xác nhận xóa',
  //     icon: <ExclamationCircleOutlined />,
  //     content: `Bạn có chắc chắn muốn xóa chủng loại "${category.name}" không?`,
  //     okText: 'Xóa',
  //     okType: 'danger',
  //     cancelText: 'Hủy',
  //     onOk() {
  //       setCategories(categories.filter((cat) => cat.id !== category.id));
  //       message.success('Xóa chủng loại thành công!');
  //     },
  //   });
  // };

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  // const printTable = () => {
  //   const selectedCategories =
  //     selectedRowKeys.length > 0
  //       ? categories.filter((category) => selectedRowKeys.includes(category.id))
  //       : categories;

  //   if (selectedCategories.length === 0) {
  //     message.warning('Không có chủng loại nào được chọn để in.');
  //     return;
  //   }

  //   const printContents = `
  //     <h2 style="text-align: center;">Danh sách chủng loại</h2>
  //     <table border="1" style="width: 100%; border-collapse: collapse;">
  //       <thead>
  //         <tr>
  //           <th>Mã chủng loại</th>
  //           <th>Tên chủng loại</th>
  //           <th>Người tạo</th>
  //         </tr>
  //       </thead>
  //       <tbody>
  //         ${selectedCategories
  //           .map(
  //             (category) => `
  //           <tr>
  //             <td>${category.code}</td>
  //             <td>${category.name}</td>
  //             <td>${category.createdBy}</td>
  //           </tr>
  //         `,
  //           )
  //           .join('')}
  //       </tbody>
  //     </table>
  //   `;

  //   const printWindow = window.open('', '', 'height=800,width=1000');
  //   if (printWindow) {
  //     printWindow.document.write(printContents);
  //     printWindow.document.close();
  //     printWindow.print();
  //   }
  // };

  // const exportToExcel = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(categories);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');
  //   XLSX.writeFile(workbook, 'DanhSachChungLoai.xlsx');
  // };

  const filterCategories = () => {
    let filteredCategories = [...CATEGORY_DATA];

    if (searchTerm.trim()) {
      filteredCategories = filteredCategories.filter((category) =>
        removeVietnameseTones(category.name).includes(removeVietnameseTones(searchTerm)),
      );
    }

    setCategories(filteredCategories);
  };

  useEffect(() => {
    filterCategories();
  }, [searchTerm, CATEGORY_DATA]);

  const columns = [
    {
      title: 'Mã chủng loại',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Chủng loại',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Category) => (
        <div className="flex items-center gap-3">
          <img
            src={record.image || 'assets/img/product/noimage.png'}
            alt={record.name}
            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
          />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    // {
    //   title: 'Người tạo',
    //   dataIndex: 'createdBy',
    //   key: 'createdBy',
    // },
    {
      title: <UnorderedListOutlined />,
      key: 'actions',
      render: (_: any, record: Category) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="edit"
                onClick={() => {
                  setSelectedCategory(record);
                  setIsEditModalOpen(true);
                }}
              >
                <EditOutlined /> Chỉnh sửa
              </Menu.Item>
              {/* <Menu.Item key="delete" onClick={() => showDeleteConfirm(record)} danger>
                <DeleteOutlined /> Xóa
              </Menu.Item> */}
            </Menu>
          }
          trigger={['click']}
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
          placeholder="Tìm kiếm theo tên chủng loại"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
        />
        {/* <Button type="primary" onClick={() => handleChangePage('Tạo chủng loại')}>
          + Tạo chủng loại mới
        </Button> */}
        {/* <Button
          type="primary"
          icon={<FileExcelOutlined />}
          onClick={exportToExcel}
          style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
        >
          Xuất Excel
        </Button>
        <Button type="primary" icon={<PrinterOutlined />} onClick={printTable}>
          In danh sách
        </Button> */}
      </div>

      <Table
        rowSelection={{
          selectedRowKeys,
          onChange: handleRowSelectionChange,
        }}
        columns={columns}
        dataSource={categories}
        rowKey="id"
      />

      <UpdateCategory
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        category={selectedCategory}
        onSave={(updatedCategory) => {
          setCategories(categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)));
        }}
      />
    </div>
  );
};

export default CategoryTable;