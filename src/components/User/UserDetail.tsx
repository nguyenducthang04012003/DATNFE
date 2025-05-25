import { useEffect, useState } from "react";
import { Modal, Input, Avatar, Typography, Row, Col } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const userRoles: { [key: number]: string } = {
  1: "Giám đốc",
  2: "Quản lí kho",
  3: "Trưởng phòng kinh doanh",
  4: "Nhân viên bán hàng",
};

export default function UserDetail({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      closeIcon={<CloseCircleOutlined />}
      title={<Title level={4}>Thông tin người dùng</Title>}
    >
      <Text type="secondary">Xem thông tin người dùng ở dưới đây</Text>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <div style={{ padding: 16, border: "1px solid #f0f0f0", borderRadius: 4 }}>
            <Text strong>Tên riêng</Text>
            <Input value={user?.firstName || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Họ
            </Text>
            <Input value={user?.lastName || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Tên người dùng
            </Text>
            <Input value={user?.userName || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Email
            </Text>
            <Input value={user?.email || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Số điện thoại
            </Text>
            <Input value={user?.phone || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Địa chỉ
            </Text>
            <Input value={user?.address || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Vai trò
            </Text>
            <Input value={userRoles[user?.roleId] || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Mã nhân viên
            </Text>
            <Input value={user?.employeeCode || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Trạng thái
            </Text>
            <Input
              value={user?.status ? "Hoạt động" : "Không hoạt động"}
              disabled
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
        <Col xs={24} md={12} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <Avatar
              size={200}
              src={user?.avatar || "https://via.placeholder.com/150"}
              style={{ border: "1px solid #f0f0f0", marginBottom: 16 }}
            />
           
          </div>
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Text strong>Tạo bởi</Text>
        <Input
          value={userRoles[user?.createdBy] || "N/A"}
          disabled
          style={{ marginTop: 8 }}
        />
        <Text strong style={{ marginTop: 16, display: "block" }}>
          Thời điểm tạo
        </Text>
        <Input value={user?.createdDate || "N/A"} disabled style={{ marginTop: 8 }} />
      </div>
    </Modal>
  );
}