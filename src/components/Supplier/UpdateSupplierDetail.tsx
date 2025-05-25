import React, { useEffect, useState } from 'react';
import { Modal, Button, Input, Select, Form, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const userMap: { [key: number]: string } = {
  1: 'Giám đốc',
  2: 'Quản lí kho',
  3: 'Trưởng phòng kinh doanh',
  4: 'Nhân viên bán hàng',
};

interface UpdateSupplierDetailProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
  onSave: (updatedSupplier: any) => void;
}

const UpdateSupplierDetail: React.FC<UpdateSupplierDetailProps> = ({ isOpen, onClose, supplier, onSave }) => {
  const [form] = Form.useForm();
  const [mounted, setMounted] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    setMounted(isOpen);
    if (isOpen && supplier) {
      form.setFieldsValue({
        id: supplier.id,
        supplierCode: supplier.supplierCode,
        supplierName: supplier.supplierName,
        supplierAddress: supplier.supplierAddress,
        supplierPhone: supplier.supplierPhone,
        status: supplier.status ? 'active' : 'inactive',
        createdBy: userMap[supplier.createdBy] || 'N/A',
        createdDate: supplier.createdDate || 'N/A',
      });
    }
  }, [isOpen, supplier, form]);

  if (!mounted) return null;

  const handleSubmit = async (values: any) => {
    const formPayload = new FormData();
    formPayload.append('Id', supplier.id.toString());
    formPayload.append('SupplierCode', values.supplierCode);
    formPayload.append('SupplierName', values.supplierName);
    formPayload.append('SupplierAddress', values.supplierAddress);
    formPayload.append('SupplierPhone', values.supplierPhone);
    formPayload.append('Status', values.status === 'active' ? '1' : '0');
    formPayload.append('CreatedBy', supplier.createdBy ? supplier.createdBy.toString() : '');
    formPayload.append('CreatedDate', supplier.createdDate || new Date().toISOString());

    try {
      const response = await axios.put(`${API_BASE_URL}/Supplier/UpdateSupplier`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        message.success('Cập nhật thông tin thành công!');
        onSave({ ...supplier, ...values, status: values.status === 'active' });
        onClose();
      } else {
        message.error(response.data.message || 'Cập nhật không thành công!');
      }
    } catch (error) {
      message.error('Có lỗi xảy ra!');
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width="80%"
      closeIcon={<CloseOutlined />}
      title="Cập nhật thông tin nhà cung cấp"
    >
      <div className="p-4">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Mã nhà cung cấp"
            name="supplierCode"
            rules={[{ required: true, message: 'Vui lòng nhập mã nhà cung cấp!' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Tên nhà cung cấp"
            name="supplierName"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Địa chỉ"
            name="supplierAddress"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Số điện thoại"
            name="supplierPhone"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Trạng thái" name="status">
            <Select>
              <Option value="active">Hoạt động</Option>
              <Option value="inactive">Không hoạt động</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Tạo bởi" name="createdBy">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Thời điểm tạo" name="createdDate">
            <Input disabled />
          </Form.Item>
          <div className="flex justify-end">
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default UpdateSupplierDetail;