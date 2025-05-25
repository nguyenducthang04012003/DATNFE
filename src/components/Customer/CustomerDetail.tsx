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

export default function CustomerDetail({
  isOpen,
  onClose,
  customer,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
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
      title={<Title level={4}>Thông tin nhà thuốc</Title>}
    >
      <Text type="secondary">Xem thông tin nhà thuốc ở dưới đây</Text>
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <div style={{ padding: 16, border: "1px solid #f0f0f0", borderRadius: 4 }}>
            <Text strong>Tên nhà thuốc</Text>
            <Input value={customer?.lastName || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Tên đăng nhập
            </Text>
            <Input value={customer?.userName || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Mã nhà thuốc
            </Text>
            <Input value={customer?.employeeCode || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Email
            </Text>
            <Input value={customer?.email || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Số điện thoại
            </Text>
            <Input value={customer?.phone || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Địa chỉ
            </Text>
            <Input value={customer?.address || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Mã số thuế
            </Text>
            <Input value={customer?.taxCode || "N/A"} disabled style={{ marginTop: 8 }} />
            <Text strong style={{ marginTop: 16, display: "block" }}>
              Trạng thái
            </Text>
            <Input
              value={customer?.status ? "Hoạt động" : "Không hoạt động"}
              disabled
              style={{ marginTop: 8 }}
            />
          </div>
        </Col>
        <Col xs={24} md={12} style={{ display: "flex", justifyContent: "center" }}>
          <Avatar
            size={200}
            src={customer?.avatar || "https://via.placeholder.com/150"}
            style={{ border: "1px solid #f0f0f0" }}
          />
        </Col>
      </Row>
      <div style={{ marginTop: 16 }}>
        <Text strong>Tạo bởi</Text>
        <Input
          value={userRoles[customer?.createdBy] || "N/A"}
          disabled
          style={{ marginTop: 8 }}
        />
        <Text strong style={{ marginTop: 16, display: "block" }}>
          Thời điểm tạo
        </Text>
        <Input value={customer?.createdDate || "N/A"} disabled style={{ marginTop: 8 }} />
      </div>
    </Modal>
  );
}