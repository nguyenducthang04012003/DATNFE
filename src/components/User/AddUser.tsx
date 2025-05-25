import React, { useState } from "react";
import { Form, Input, Button, Select, message } from "antd";
import axios from "axios";

const { Option } = Select;

const roles = {
  2: "Quản lí kho",
  3: "Trưởng phòng kinh doanh",
  4: "Nhân viên bán hàng",
};

interface FormValues {
  userName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  age: number;
  roleId: string;
  status: boolean;
  avatar?: File | null;
}

export default function AddUser() {
  const [form] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileInput = e.target;
    if (fileInput.files && fileInput.files[0]) {
      const selectedFile = fileInput.files[0];
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatarPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setAvatarPreview(null);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("UserName", values.userName);
    formData.append("FirstName", values.firstName);
    formData.append("LastName", values.lastName);
    formData.append("Phone", values.phone);
    formData.append("Email", values.email);
    formData.append("Password", values.password);
    formData.append("Address", values.address);
    formData.append("Age", values.age.toString());
    formData.append("RoleId", values.roleId);
    formData.append("Status", values.status.toString());
    if (file) {
      formData.append("avatar", file);
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/User/CreateUser`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        message.success("Đã tạo người dùng thành công!");
        form.resetFields();
        setAvatarPreview(null);
        setFile(null);
      } else {
        message.error(response.data.message || "Có lỗi xảy ra khi tạo người dùng!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(
          error.response?.data.message || "Có lỗi xảy ra khi gửi yêu cầu!"
        );
      } else {
        message.error("Lỗi không xác định!");
      }
    }
  };

  return (
    <div className="p-6 w-full transition-all rounded-lg shadow-sm mt-[60px] bg-[#fafbfe]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tạo người dùng mới</h1>
        <p className="text-sm text-gray-500">Tạo một người dùng mới theo form bên dưới</p>
      </div>

      <div className="p-5 bg-white rounded-lg shadow w-full max-w-7xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ status: true }}
        >
          <Form.Item label="Avatar" name="avatar">
            <Input
              id="avatarInput"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover mt-2"
              />
            )}
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Form.Item
              label="Tên đăng nhập"
              name="userName"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                { whitespace: true, message: "Tên đăng nhập không được chỉ chứa khoảng trắng!" },
              ]}
            >
              <Input placeholder="Nhập tên đăng nhập" />
            </Form.Item>

            <Form.Item
              label="Tên riêng"
              name="firstName"
              rules={[
                { required: true, message: "Vui lòng nhập tên riêng!" },
                { whitespace: true, message: "Tên riêng không được chỉ chứa khoảng trắng!" },
              ]}
            >
              <Input placeholder="Nhập tên riêng" />
            </Form.Item>

            <Form.Item
              label="Tên họ"
              name="lastName"
              rules={[
                { required: true, message: "Vui lòng nhập tên họ!" },
                { whitespace: true, message: "Tên họ không được chỉ chứa khoảng trắng!" },
              ]}
            >
              <Input placeholder="Nhập tên họ" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: "Số điện thoại phải có 10-11 chữ số!",
                },
              ]}
            >
              <Input type="tel" placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input type="email" placeholder="Nhập email" />
            </Form.Item>

            <Form.Item
              label="Tuổi"
              name="age"
              rules={[
                { required: true, message: "Vui lòng nhập tuổi!" },
                {
                  type: "number",
                  min: 18,
                  max: 100,
                  message: "Tuổi phải từ 18 đến 100!",
                  transform: (value) => Number(value),
                },
              ]}
            >
              <Input type="number" placeholder="Nhập tuổi" />
            </Form.Item>

            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ!" },
                { whitespace: true, message: "Địa chỉ không được chỉ chứa khoảng trắng!" },
              ]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>

            <Form.Item
              label="Vai trò"
              name="roleId"
              rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
            >
              <Select placeholder="Chọn vai trò">
                {Object.entries(roles).map(([id, name]) => (
                  <Option key={id} value={id}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Trạng thái tài khoản"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái tài khoản!" }]}
            >
              <Select placeholder="Chọn trạng thái tài khoản">
                <Option value={true}>Kích hoạt</Option>
                <Option value={false}>Vô hiệu hóa</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </div>

          <div className="flex gap-4 justify-end">
            <Button
              type="default"
              onClick={() => {
                form.resetFields();
                setAvatarPreview(null);
                setFile(null);
                message.info("Đã hủy!");
              }}
            >
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Tạo
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}