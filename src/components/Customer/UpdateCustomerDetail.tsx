import { useEffect, useState } from "react";
import {
  Modal,
  Button,
  Input,
  Avatar,
  Typography,
  Row,
  Col,
  Form,
  Select,
  Upload,
  message,
} from "antd";
import { CloseCircleOutlined, UploadOutlined } from "@ant-design/icons";
import axios from "axios";

const { Title, Text } = Typography;

export default function UpdateCustomerDetail({
  isOpen,
  onClose,
  customer,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onSave: (updatedCustomer: any) => void;
}) {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setVisible(isOpen);
    if (isOpen && customer) {
      form.setFieldsValue({
        ...customer,
        status: customer?.status ? "active" : "inactive",
      });
    }
  }, [isOpen, customer, form]);

  const handleAvatarChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList);
    if (newFileList.length > 0) {
      const file = newFileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => {
        form.setFieldsValue({ avatar: e.target?.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (values: any) => {
    const formPayload = new FormData();
    formPayload.append("LastName", values.lastName || "");
    formPayload.append("EmployeeCode", values.employeeCode || "");
    formPayload.append("Email", values.email || "");
    formPayload.append("Phone", values.phone || "");
    formPayload.append("Address", values.address || "");
    formPayload.append("TaxCode", values.taxCode || "");
    formPayload.append("Status", values.status === "active" ? "1" : "0");
    if (fileList.length > 0) {
      formPayload.append("Avatar", fileList[0].originFileObj);
    }
    formPayload.append("RoleId", "5");
    formPayload.append("UserId", customer.userId);

    try {
      const response = await axios.put(
        `${API_BASE_URL}/User/UpdateUser`,
        formPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        message.success("Cập nhật thông tin thành công!");
        onSave({ ...customer, ...values, status: values.status === "active" });
        onClose();
      } else {
        message.error(response.data.message || "Cập nhật không thành công!");
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      message.error("Có lỗi xảy ra khi cập nhật!");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      closeIcon={<CloseCircleOutlined />}
      title={<Title level={4}>Cập nhật thông tin nhà thuốc</Title>}
    >
      <Text type="secondary">Cập nhật thông tin nhà thuốc ở form bên dưới</Text>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 16 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item label="ID" name="userId">
              <Input disabled />
            </Form.Item>
            <Form.Item
              label="Tên nhà thuốc"
              name="lastName"
              rules={[{ required: true, message: "Vui lòng nhập tên nhà thuốc!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Mã nhà thuốc"
              name="employeeCode"
              rules={[{ required: true, message: "Vui lòng nhập mã nhà thuốc!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              rules={[{ type: "email", message: "Email không hợp lệ!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label="Địa chỉ" name="address">
              <Input />
            </Form.Item>
            <Form.Item label="Mã số thuế" name="taxCode">
              <Input />
            </Form.Item>
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select>
                <Select.Option value="active">Hoạt động</Select.Option>
                <Select.Option value="inactive">Không hoạt động</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12} style={{ display: "flex", justifyContent: "center" }}>
            <Form.Item name="avatar">
              <Avatar
                size={200}
                src={form.getFieldValue("avatar") || "https://via.placeholder.com/150"}
                style={{ marginBottom: 16 }}
              />
              <Upload
                fileList={fileList}
                beforeUpload={() => false}
                onChange={handleAvatarChange}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Form.Item label="Tạo bởi" name="createdBy">
              <Input disabled />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Thời điểm tạo" name="createdDate">
              <Input disabled />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item>
          <div style={{ textAlign: "right" }}>
            <Button style={{ marginRight: 8 }} onClick={onClose}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}