import React, { useState, useEffect } from 'react';
import { Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import SupplierTable from '../../components/Supplier/SupplierTable';
import axios from 'axios';
import { useAuth } from '../Home/AuthContext';

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

interface SupplierListPageProps {
  handleChangePage: (page: string) => void;
}

const SupplierListPage: React.FC<SupplierListPageProps> = ({ /* handleChangePage */ }) => {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const response = await axios.get(`${API_BASE_URL}/Supplier/GetSupplierList`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*',
          },
        });

        if (response.data.success) {
          setSuppliers(response.data.data || []);
        } else {
          throw new Error(response.data.message || 'Không thể tải danh sách nhà cung cấp!');
        }
      } catch (error: any) {
        console.error('Lỗi khi lấy danh sách nhà cung cấp:', error);
        setSuppliers([]);
        // const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách nhà cung cấp!';
        // Không hiển thị thông báo lỗi nếu là lỗi 401, vì AuthContext sẽ xử lý làm mới token
        if (error.response?.status !== 401) {
          // Có thể thêm thông báo lỗi bằng Ant Design message nếu cần
          // message.error(errorMessage);
        }
      }
    };

    if (user) {
      fetchSuppliers();
    }
  }, [user]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierPhone.includes(searchTerm);
    const matchesStatus = !selectedStatus || (selectedStatus === 'Active' ? supplier.status : !supplier.status);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">Danh sách nhà cung cấp</h1>
          <p className="text-sm text-gray-500">Quản lý nhà cung cấp</p>
        </div>
        {/* <Button type="primary" onClick={() => handleChangePage('Tạo nhà cung cấp')}>
          Tạo mới nhà cung cấp
        </Button> */}
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Select
              placeholder="Lọc theo trạng thái"
              value={selectedStatus}
              onChange={handleStatusChange}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value="">Tất cả trạng thái</Select.Option>
              <Select.Option value="Active">Hoạt động</Select.Option>
              <Select.Option value="Inactive">Không hoạt động</Select.Option>
            </Select>
          </Space>
          {/* <Space>
            <Button icon={<FileTextOutlined />} />
            <Button icon={<FileExcelOutlined />} onClick={exportToExcel} />
            <Button icon={<PrinterOutlined />} />
          </Space> */}
        </div>
        <SupplierTable suppliers={filteredSuppliers} />
      </div>
    </div>
  );
};

export default SupplierListPage;