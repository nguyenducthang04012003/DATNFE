import React, { useEffect, useState } from 'react';
import { Modal, Input, Button, Typography } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const userRoles: { [key: number]: string } = {
  1: 'Giám đốc',
  2: 'Quản lí kho',
  3: 'Trưởng phòng kinh doanh',
  4: 'Nhân viên bán hàng',
};

interface SupplierDetailProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
}

const SupplierDetail: React.FC<SupplierDetailProps> = ({ isOpen, onClose, supplier }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(isOpen);
  }, [isOpen]);

  if (!mounted || !supplier) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="80%"
      closeIcon={<CloseOutlined />}
      title={
        <div>
          <Title level={3}>Chi tiết nhà cung cấp</Title>
          <Text type="secondary">Thông tin chi tiết nhà cung cấp</Text>
        </div>
      }
    >
      <div className="p-4">
        <div className="border rounded-lg p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Mã nhà cung cấp</label>
            <Input value={supplier.supplierCode || 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Tên nhà cung cấp</label>
            <Input value={supplier.supplierName || 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <Input value={supplier.supplierAddress || 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <Input value={supplier.supplierPhone || 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
            <Input value={supplier.status ? 'Hoạt động' : 'Không hoạt động'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Tạo bởi</label>
            <Input value={userRoles[supplier.createdBy] || 'N/A'} readOnly />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Thời điểm tạo</label>
            <Input value={supplier.createdDate || 'N/A'} readOnly />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
};

export default SupplierDetail;