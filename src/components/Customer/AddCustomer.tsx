import { useState } from "react";
import { Form, Input, Button, Select, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import type { UploadChangeParam, UploadFile } from "antd/es/upload/interface";

interface FormValues {
  lastName: string;
  userName: string;
  email: string;
  phone: string;
  address: string;
  status: boolean;
  password: string;
  taxCode: string;
  employeeCode?: string;
}

export default function AddCustomer() {
  const [form] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleAvatarChange = (info: UploadChangeParam<UploadFile>) => {
    const file = info.file.originFileObj;
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatarPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarFile(null);
      setAvatarPreview(null);
    }
    return false; // Prevent automatic upload
  };

  const handleSubmit = async (values: FormValues) => {
    const formData = new FormData();
    formData.append("UserName", values.userName);
    formData.append("FirstName", values.userName); // Using userName for FirstName
    formData.append("LastName", values.lastName);
    formData.append("Phone", values.phone);
    formData.append("Email", values.email);
    formData.append("Password", values.password);
    formData.append("Address", values.address);
    formData.append("RoleId", "5"); // Hardcoded as per cURL
    formData.append("EmployeeCode", values.employeeCode || "");
    formData.append("TaxCode", values.taxCode);
    formData.append("Status", values.status ? "true" : "false");
    if (avatarFile) {
      formData.append("Avatar", avatarFile);
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/User/CreateUser`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization:
              "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwOi8vc2NoZW1hcy54bWxzb2FwLm9yZy93cy8yMDA1LzA1L2lkZW50aXR5L2NsYWltcy9uYW1laWRlbnRpZmllciI6IlNhbGVtYW4iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJTYWxlc01hbiIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL2VtYWlsYWRkcmVzcyI6IkxvY05ISEUxNzIzNDBAZnB0LmVkdS52biIsImh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzLzIwMDUvMDUvaWRlbnRpdHkvY2xhaW1zL25hbWUiOiJM4buZYyAgICAgICAgTmfDtCIsIlVzZXJJZCI6IjUiLCJleHAiOjE3NDY1OTcwNDEsImlzcyI6Imh0dHBzOi8vcGhhcm1hZGlzdGlwcm9iZS5mdW4iLCJhdWQiOiJodHRwczovL3BoYXJtYWRpc3RpcHJvYmUuZnVuIn0.FcJqRvA6G_OW0_Ej2fhfnxN2BlXqep8wLVRIY1T5SlI",
          },
        }
      );

      if (response.data.success) {
        message.success("Đã tạo nhà thuốc thành công!");
        form.resetFields();
        setAvatarPreview(null);
        setAvatarFile(null);
      } else {
        message.error(response.data.message || "Có lỗi xảy ra khi tạo nhà thuốc!");
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
        <h1 className="text-xl font-semibold text-gray-900">Tạo nhà thuốc</h1>
        <p className="text-sm text-gray-500">Tạo nhà thuốc mới</p>
      </div>

      <div className="p-5 bg-white rounded-lg shadow w-full max-w-7xl mx-auto">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Avatar" name="avatar">
            <Upload
              name="avatar"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleAvatarChange}
              accept="image/*"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <UploadOutlined />
                  <div>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="Tên nhà thuốc"
              name="lastName"
              rules={[
                { required: true, message: "Vui lòng nhập tên nhà thuốc!" },
                {
                  whitespace: true,
                  message: "Tên nhà thuốc không được chỉ chứa khoảng trắng!",
                },
              ]}
            >
              <Input placeholder="Nhập tên nhà thuốc" />
            </Form.Item>

            <Form.Item
              label="Tên đăng nhập"
              name="userName"
              rules={[
                { required: true, message: "Vui lòng nhập tên đăng nhập!" },
                {
                  whitespace: true,
                  message: "Tên đăng nhập không được chỉ chứa khoảng trắng!",
                },
              ]}
            >
              <Input placeholder="Nhập tên đăng nhập" />
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
              label="Địa chỉ"
              name="address"
              rules={[
                { required: true, message: "Vui lòng nhập địa chỉ!" },
                {
                  whitespace: true,
                  message: "Địa chỉ không được chỉ chứa khoảng trắng!",
                },
              ]}
            >
              <Input placeholder="Nhập địa chỉ" />
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
              label="Mã số thuế"
              name="taxCode"
              rules={[
                { required: true, message: "Vui lòng nhập mã số thuế!" },
                {
                  whitespace: true,
                  message: "Mã số thuế không được chỉ chứa khoảng trắng!",
                },
              ]}
            >
              <Input placeholder="Nhập mã số thuế" />
            </Form.Item>

            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select placeholder="Chọn trạng thái">
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Không hoạt động</Select.Option>
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

          <div className="flex gap-4">
            <Button
              type="primary"
              htmlType="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-md font-semibold text-sm hover:bg-blue-600 focus:ring-2 focus:ring-blue-500"
            >
              Tạo
            </Button>
            <Button
              type="default"
              onClick={() => {
                form.resetFields();
                setAvatarPreview(null);
                setAvatarFile(null);
              }}
              className="px-6 py-3 bg-gray-500 text-white rounded-md font-semibold text-sm hover:bg-gray-600 focus:ring-2 focus:ring-gray-500"
            >
              Hủy
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}