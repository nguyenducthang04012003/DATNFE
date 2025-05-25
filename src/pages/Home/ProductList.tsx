import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Space, Collapse } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import ProductTable from '../../components/Product/ProductTable';
import { useAuth } from '../Home/AuthContext';

const { Panel } = Collapse;
const { Option } = Select;

interface Product {
  productId: number;
  productCode: string;
  manufactureName: string;
  productName: string;
  unit: string;
  categoryName: string;
  description: string;
  sellingPrice: number;
  createdBy: number | null;
  createdDate: string | null;
  status: boolean;
  vat: number;
  storageconditions: number;
  weight: number;
  volumePerUnit: number;
  images: string[];
}

interface User {
  customerId: number;
  username: string;
  address: string;
  avatar?: string;
  roleName?: string;
}

interface ProductListPageProps {
  handleChangePage: (page: string, productId?: number) => void;
}

const ProductListPage: React.FC<ProductListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [usersMap, setUsersMap] = useState<Map<number, User>>(new Map());
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [createdByFilter, setCreatedByFilter] = useState<string>('');
  const [manufactureFilter, setManufactureFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  // Fetch product data from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
        }

        const response = await axios.get(`${API_BASE_URL}/Product/ListProduct`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': '*/*',
          },
        });

        if (response.data.success) {
          const validProducts = response.data.data.filter((product: Product) => product.productId != null);
          setFilteredProducts(validProducts);
        } else {
          throw new Error(response.data.message || 'Không thể tải danh sách sản phẩm!');
        }
      } catch (error: any) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        setFilteredProducts([]);
        // const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tải danh sách sản phẩm!';
        if (error.response?.status !== 401) {
          // Có thể thêm thông báo lỗi bằng Ant Design message nếu cần
          // message.error(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProducts();
    }
  }, [user]);

  // Fetch user information for createdBy
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.error('Không tìm thấy token khi lấy thông tin người dùng.');
        return;
      }

      const userIds = Array.from(
        new Set(filteredProducts.map((product) => product.createdBy).filter((id): id is number => id != null))
      );

      const newUsersMap = new Map<number, User>();
      for (const userId of userIds) {
        try {
          const response = await axios.get(`${API_BASE_URL}/User/GetUserById/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': '*/*',
            },
          });

          if (response.data.success) {
            const userData = response.data.data;
            newUsersMap.set(userId, {
              customerId: userId,
              username: userData.userName,
              address: userData.address || 'Chưa có địa chỉ',
              avatar: userData.userAvatar,
              roleName: userData.roleName,
            });
          } else {
            console.error(`Không thể tải thông tin người dùng ${userId}:`, response.data.message);
          }
        } catch (error) {
          console.error(`Lỗi khi lấy thông tin người dùng ${userId}:`, error);
        }
      }
      setUsersMap(newUsersMap);
    };

    if (user && filteredProducts.length > 0) {
      fetchUsers();
    }
  }, [user, filteredProducts]);

  // Filter utilities
  const uniqueCreators = Array.from(
    new Set(
      filteredProducts
        .map((product) => {
          const user = product.createdBy ? usersMap.get(product.createdBy) : null;
          return user ? user.username : 'Không xác định';
        })
        .filter((username) => username !== 'Không xác định')
    )
  );
  const uniqueManufacturers = Array.from(new Set(filteredProducts.map((product) => product.manufactureName)));
  const uniqueCategories = Array.from(new Set(filteredProducts.map((product) => product.categoryName)));

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      {/* Header */}
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách sản phẩm</h1>
          <p className="text-sm text-gray-500">Quản lý sản phẩm</p>
        </div>
        {/* <Button type="primary" onClick={() => handleChangePage('Tạo sản phẩm')}>
          Tạo mới sản phẩm
        </Button> */}
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
              Lọc
            </Button>
          </Space>
          {/* <Space>
            <Button icon={<FileExcelOutlined />} onClick={() => {
              // Move exportToExcel logic here if needed
            }} />
            <Button icon={<PrinterOutlined />} onClick={() => {
              // Move printTable logic here if needed
            }} />
          </Space> */}
        </div>

        {showFilters && (
          <Collapse defaultActiveKey={['1']}>
            <Panel header="Bộ lọc nâng cao" key="1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select
                  placeholder="Chọn danh mục"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">Tất cả danh mục</Option>
                  {uniqueCategories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="Người tạo"
                  value={createdByFilter}
                  onChange={setCreatedByFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">Tất cả người tạo</Option>
                  {uniqueCreators.map((creator) => (
                    <Option key={creator} value={creator}>
                      {creator}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="Hãng sản xuất"
                  value={manufactureFilter}
                  onChange={setManufactureFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">Tất cả hãng sản xuất</Option>
                  {uniqueManufacturers.map((manufacturer) => (
                    <Option key={manufacturer} value={manufacturer}>
                      {manufacturer}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="Trạng thái"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="">Tất cả trạng thái</Option>
                  <Option value="true">Đang bán</Option>
                  <Option value="false">Ngừng bán</Option>
                </Select>
                <Input
                  type="number"
                  placeholder="Giá từ"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  style={{ width: '100%' }}
                />
                <Input
                  type="number"
                  placeholder="Giá đến"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  style={{ width: '100%' }}
                />
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setStatusFilter('');
                    setMinPrice('');
                    setMaxPrice('');
                    setCreatedByFilter('');
                    setManufactureFilter('');
                    setDateRange(null);
                  }}
                  style={{ width: '100%' }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </Panel>
          </Collapse>
        )}

        {/* Table */}
        <ProductTable
          PRODUCTS_DATA={filteredProducts}
          handleChangePage={handleChangePage}
          searchTerm={searchTerm}
          categoryFilter={categoryFilter}
          statusFilter={statusFilter}
          minPrice={minPrice}
          maxPrice={maxPrice}
          createdByFilter={createdByFilter}
          manufactureFilter={manufactureFilter}
          dateRange={dateRange}
          usersMap={usersMap}
        />
      </div>
    </div>
  );
};

export default ProductListPage;