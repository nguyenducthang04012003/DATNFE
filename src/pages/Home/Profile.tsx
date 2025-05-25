import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Upload, message, Typography, Card, Spin } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useAuth, apiClient } from '../../pages/Home/AuthContext';
import Cookies from 'js-cookie';
import Sidebar from "../../components/global/Sidebar";
import Navbar from "../../components/global/Navbar";
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';

const { Title } = Typography;

interface ProfileFormValues {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  age: number | null;
  address: string;
  taxCode: string;
}

const Profile: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user?.avatar);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [activePage] = useState<string>("");

  useEffect(() => {
    if (!user) {
      message.error('Vui lòng đăng nhập để xem hồ sơ!');
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get(`/User/GetUserById/${user.customerId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        });
        if (response.data.success) {
          const fetchedUserData = response.data.data;
          setUserData(fetchedUserData);
          form.setFieldsValue({
            username: fetchedUserData.userName,
            firstName: fetchedUserData.firstName || '',
            lastName: fetchedUserData.lastName || '',
            phone: fetchedUserData.phone || '',
            email: fetchedUserData.email || '',
            age: fetchedUserData.age || null,
            address: fetchedUserData.address || '',
            taxCode: fetchedUserData.taxCode || '',
          });
          setAvatarUrl(fetchedUserData.avatar || user.avatar);
        } else {
          message.error(response.data.message || 'Không thể tải thông tin hồ sơ!');
        }
      } catch (error) {
        message.error('Lỗi khi tải thông tin hồ sơ!');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, form, navigate]);

  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    const file = info.file;
    if (file.status !== 'removed') {
      setFileList([file]);
      if (file.originFileObj) {
        const url = URL.createObjectURL(file.originFileObj);
        setAvatarUrl(url);
      }
    } else {
      setFileList([]);
      setAvatarUrl(userData?.avatar || user?.avatar);
    }
  };

  const onFinish = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('UserId', userData.userId.toString());
      formData.append('UserName', values.username);
      formData.append('FirstName', values.firstName || '');
      formData.append('LastName', values.lastName || '');
      formData.append('Phone', values.phone || '');
      formData.append('Email', values.email || '');
      formData.append('Age', values.age ? values.age.toString() : '');
      formData.append('Address', values.address || '');
      formData.append('RoleId', userData.roleId ? userData.roleId.toString() : '');
      formData.append('EmployeeCode', userData.employeeCode || '');
      formData.append('TaxCode', values.taxCode || '');
      formData.append('Status', userData.status.toString());
      formData.append('CreatedBy', userData.createdBy ? userData.createdBy.toString() : '');
      formData.append('CreatedDate', userData.createdDate || '');
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('Avatar', fileList[0].originFileObj);
      }

      const response = await apiClient.put('/User/UpdateUser', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedUser = {
          ...user!,
          customerId: response.data.data.userId,
          username: response.data.data.userName,
          firstName: response.data.data.firstName,
          lastName: response.data.data.lastName,
          phone: response.data.data.phone,
          email: response.data.data.email,
          age: response.data.data.age,
          address: response.data.data.address,
          taxCode: response.data.data.taxCode,
          avatar: response.data.data.avatar || user!.avatar,
          roleId: response.data.data.roleId,
          roleName: response.data.data.roleName || user!.roleName,
        };

        setAvatarUrl(response.data.data.avatar || user!.avatar);
        Cookies.set('user', JSON.stringify(updatedUser), { expires: 7 });
        await login(undefined, undefined, localStorage.getItem('accessToken')!);

        message.success('Cập nhật hồ sơ thành công!');
        setFileList([]);
      } else {
        message.error(response.data.message || 'Cập nhật hồ sơ thất bại!');
      }
    } catch (error) {
      message.error('Lỗi khi cập nhật hồ sơ!');
      console.error('Lỗi khi gọi API:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (page: string) => {
    navigate('/home', { state: { activePage: page } });
  };

  if (!user) return null;

  return (
    <div className="w-screen h-screen flex">
      <Sidebar activeSidebar={activePage} handleChangePage={handleChangePage} />
      <div className="flex-grow">
        <Navbar />
        <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto', marginTop: '60px' }}>
          <Title level={2}>Hồ sơ người dùng</Title>
          <Card>
            {loading ? (
              <Spin tip="Đang tải..." />
            ) : (
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  username: user.username,
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                  age: null,
                  address: user.address,
                  taxCode: '',
                }}
              >
                <Form.Item
                  label="Tên người dùng"
                  name="username"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên người dùng!' },
                    { whitespace: true, message: 'Tên người dùng không được chỉ chứa khoảng trắng!' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item label="Tên" name="firstName">
                  <Input />
                </Form.Item>

                <Form.Item label="Họ" name="lastName">
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Số điện thoại"
                  name="phone"
                  rules={[
                    {
                      validator: async (_: any, value: string) => {
                        if (value && !/^[0-9]{10,11}$/.test(value)) {
                          throw new Error('Số điện thoại phải có 10-11 chữ số!');
                        }
                      },
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Vui lòng nhập email hợp lệ!' },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Tuổi"
                  name="age"
                  rules={[
                    {
                      validator: async (_: any, value: number | null) => {
                        if (value !== null && value <= 0) {
                          throw new Error('Tuổi phải lớn hơn 0!');
                        }
                      },
                    },
                  ]}
                >
                  <Input type="number" min={0} />
                </Form.Item>

                <Form.Item label="Địa chỉ" name="address">
                  <Input />
                </Form.Item>

                <Form.Item label="Mã thuế" name="taxCode">
                  <Input />
                </Form.Item>

                <Form.Item label="Ảnh đại diện" name="avatar">
                  {avatarUrl && (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px' }}
                    />
                  )}
                  <Upload
                    fileList={fileList}
                    beforeUpload={() => false}
                    onChange={handleAvatarChange}
                    accept="image/*"
                  >
                    <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Cập nhật hồ sơ
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;