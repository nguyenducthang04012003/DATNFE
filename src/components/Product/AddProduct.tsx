import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../pages/Home/AuthContext';
import { Form, Input, Select, Button, Upload, message, Row, Col, Card } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;

interface Category {
  id: number;
  categoryMainId: number;
  categoryName: string;
  categoryCode: string;
  image: string | null;
  subCategories: any[];
}

export default function ProductAdd({ handleChangePage }: { handleChangePage: (page: string) => void }) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Check if user is authorized (Director role)
  useEffect(() => {
    if (user && user.roleName !== 'Director') {
      message.error('Bạn không có quyền truy cập trang này!');
      handleChangePage('Danh sách sản phẩm');
    }
  }, [user, handleChangePage]);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Category/subcategory`);
        if (response.status === 200) {
          setCategories(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        // message.error('Không thể tải danh sách danh mục. Vui lòng thử lại!');
      }
    };

    fetchCategories();
  }, []);

  // Handle file upload change
  const handleFileChange = ({ fileList }: any) => {
    const newFileList = fileList.filter((file: any) => {
      const isImage = file.type.startsWith('image/');
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isImage) {
        message.error('Chỉ được chọn tệp hình ảnh (PNG, JPG, JPEG, GIF)!');
        return false;
      }
      if (!isLt10M) {
        message.error('Ảnh phải nhỏ hơn 10MB!');
        return false;
      }
      return true;
    });
    setFileList(newFileList);
  };

  // Handle form submission
  const handleSubmit = async (values: any) => {
    if (fileList.length === 0) {
      message.error('Vui lòng tải lên ít nhất một ảnh sản phẩm!');
      return;
    }

    if (!user || !user.customerId) {
      message.error('Không thể xác định người tạo sản phẩm. Vui lòng đăng nhập lại!');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại!');
      }

      // Prepare FormData for API
      const storageConditionValue = Number(values.storageconditions);
      if (![1, 2, 3].includes(storageConditionValue)) {
        throw new Error('Giá trị điều kiện bảo quản không hợp lệ!');
      }

      const formDataToSend = new FormData();
      formDataToSend.append('productName', values.productName);
      formDataToSend.append('manufactureName', values.manufactureName);
      formDataToSend.append('categoryId', values.categoryId.toString());
      formDataToSend.append('unit', values.unit);
      formDataToSend.append('status', values.status);
      formDataToSend.append('description', values.description);
      formDataToSend.append('sellingPrice', values.sellingPrice.toString());
      formDataToSend.append('storageconditions', storageConditionValue.toString());
      formDataToSend.append('weight', values.weight.toString());
      formDataToSend.append('vat', values.vat.toString());
      formDataToSend.append('volumePerUnit', values.volumePerUnit.toString());
      formDataToSend.append('createdBy', user.customerId.toString());

      // Append image files
      fileList.forEach((file: any) => {
        formDataToSend.append('images', file.originFileObj);
      });

      console.log('Sending product data:', {
        productName: values.productName,
        manufactureName: values.manufactureName,
        categoryId: values.categoryId,
        unit: values.unit,
        status: values.status,
        description: values.description,
        sellingPrice: values.sellingPrice,
        storageconditions: storageConditionValue,
        weight: values.weight,
        vat: values.vat,
        volumePerUnit: values.volumePerUnit,
        createdBy: user.customerId,
      });

      // Send request to API
      const response = await axios.post(`${API_BASE_URL}/Product`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('API response:', response.data);

      if (response.status === 201) {
        message.success('Thêm sản phẩm thành công!');
        handleChangePage('Danh sách sản phẩm');
      } else {
        throw new Error('Phản hồi không hợp lệ từ server!');
      }
    } catch (error: any) {
      console.error('Failed to add product:', error);
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Thêm sản phẩm thất bại. Vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no user is logged in
  if (!user) {
    message.error('Vui lòng đăng nhập để thêm sản phẩm!');
    handleChangePage('Danh sách sản phẩm');
    return null;
  }

  return (
    <div className="p-6 w-full transition-all rounded-lg shadow-sm mt-[60px] bg-[#fafbfe]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tạo sản phẩm</h1>
        <p className="text-sm text-gray-500">Nhập thông tin chi tiết của sản phẩm mới</p>
      </div>

      <Card title="Thông tin sản phẩm" className="w-full">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'true',
            storageconditions: '1',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Tên sản phẩm"
                name="productName"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Nhà sản xuất"
                name="manufactureName"
                rules={[{ required: true, message: 'Vui lòng nhập nhà sản xuất!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map((cat) => (
                    <Option key={cat.id} value={cat.id}>
                      {cat.categoryName.trim()}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Select>
                  <Option value="true">Đang bán</Option>
                  <Option value="false">Ngừng bán</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Đơn vị tính"
                name="unit"
                rules={[{ required: true, message: 'Vui lòng nhập đơn vị tính!' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Giá bán (VND)"
                name="sellingPrice"
                rules={[
                  { required: true, message: 'Vui lòng nhập giá bán!' },
                  {
                    validator: async (_, value) => {
                      if (!value || Number(value) > 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Giá bán phải là số dương!'));
                    },
                  },
                ]}
              >
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Trọng lượng (kg)"
                name="weight"
                rules={[
                  { required: true, message: 'Vui lòng nhập trọng lượng!' },
                  {
                    validator: async (_, value) => {
                      if (!value || Number(value) > 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Trọng lượng phải là số dương!'));
                    },
                  },
                ]}
              >
                <Input type="number" min={0} step="0.01" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Điều kiện bảo quản"
                name="storageconditions"
                rules={[{ required: true, message: 'Vui lòng chọn điều kiện bảo quản!' }]}
              >
                <Select placeholder="Chọn điều kiện bảo quản">
                  <Option value="1">Bảo quản thường (Nhiệt độ: 15-30°C; Độ ẩm &lt; 75%)</Option>
                  <Option value="2">Bảo quản lạnh (Nhiệt độ: 2-8°C; Độ ẩm &lt; 45%)</Option>
                  <Option value="3">Bảo quản mát (Nhiệt độ: 8-15°C; Độ ẩm &lt; 70%)</Option> </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="VAT (%)"
                name="vat"
                rules={[
                  { required: true, message: 'Vui lòng nhập VAT!' },
                  {
                    validator: async (_, value) => {
                      if (!value || Number(value) >= 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('VAT phải là số không âm!'));
                    },
                  },
                ]}
              >
                <Input type="number" min={0} max={100} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={8}>
              <Form.Item
                label="Dung tích (cm³)"
                name="volumePerUnit"
                rules={[
                  { required: true, message: 'Vui lòng nhập dung tích!' },
                  {
                    validator: async (_, value) => {
                      if (!value || Number(value) > 0) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Dung tích phải là số dương!'));
                    },
                  },
                ]}
              >
                <Input type="number" min={0} step="0.01" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Mô tả sản phẩm"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả sản phẩm!' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item label="Ảnh sản phẩm">
            <Upload
              listType="picture"
              fileList={fileList}
              onChange={handleFileChange}
              beforeUpload={() => false}
              multiple
              accept="image/png,image/jpeg,image/gif"
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF tới 10MB</p>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu
            </Button>
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => handleChangePage('Danh sách sản phẩm')}
              disabled={loading}
            >
              Hủy
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}