import React, { useState } from 'react';
import { Table, Modal, Select, message, Dropdown, Button, Menu } from 'antd';
import { EyeOutlined, EditOutlined, MoreOutlined } from '@ant-design/icons';
import SupplierDetailsModal from './SupplierDetail';
import UpdateSupplierDetailsModal from './UpdateSupplierDetail';
import axios from 'axios';

interface Supplier {
  id: number;
  supplierCode: string;
  supplierName: string;
  supplierAddress: string;
  supplierPhone: string;
  createdBy: string;
  createdDate: string;
  status: boolean;
}

interface SupplierTableProps {
  suppliers: Supplier[];
}

const SupplierTable: React.FC<SupplierTableProps> = ({ suppliers }) => {
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleStatusChange = (value: string, record: Supplier) => {
    const newStatus = value === 'Hoạt động';

    Modal.confirm({
      title: 'Bạn có chắc chắn muốn đổi trạng thái?',
      content: 'Hành động này sẽ thay đổi trạng thái của nhà cung cấp.',
      okText: 'Đổi trạng thái',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axios.put(`${API_BASE_URL}/Supplier/ActivateDeactivateSupplier/${record.id}/${newStatus}`);
          message.success('Cập nhật trạng thái thành công!');
        } catch (error) {
          message.error('Lỗi khi cập nhật trạng thái!');
        }
      },
    });
  };

  const columns = [
    // { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Mã nhà cung cấp', dataIndex: 'supplierCode', key: 'supplierCode' },
    { title: 'Tên nhà cung cấp', dataIndex: 'supplierName', key: 'supplierName' },
    { title: 'Số điện thoại', dataIndex: 'supplierPhone', key: 'supplierPhone' },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean, record: Supplier) => (
        <Select
          defaultValue={status ? 'Hoạt động' : 'Không hoạt động'}
          onChange={(value) => handleStatusChange(value, record)}
          style={{ width: 120 }}
        >
          <Select.Option value="Hoạt động">Hoạt động</Select.Option>
          <Select.Option value="Không hoạt động">Không hoạt động</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Tính năng',
      key: 'actions',
      render: (_: any, record: Supplier) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedSupplier(record);
                  setIsViewModalOpen(true);
                }}
              >
                Xem
              </Menu.Item>
              <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedSupplier(record);
                  setIsEditModalOpen(true);
                }}
              >
                Chỉnh sửa
              </Menu.Item>
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
    <div>
      <Table
        columns={columns}
        dataSource={suppliers}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
      <SupplierDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        supplier={selectedSupplier}
      />
      <UpdateSupplierDetailsModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        supplier={selectedSupplier}
        onSave={() => {
          /* Refresh supplier data if needed */
        }}
      />
    </div>
  );
};

export default SupplierTable;