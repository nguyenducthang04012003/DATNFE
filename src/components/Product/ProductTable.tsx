import React, { useState, useEffect } from 'react';
import {
  Table,
  Select,
  Button,
  Modal,
  Image,
  Form,
  Input,
  InputNumber,
  Upload,
  Card,
  message,
  Row,
  Col,
  Dropdown,
  Carousel,
  Tooltip,
} from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  UploadOutlined,
  MoreOutlined,
  LeftOutlined,
  RightOutlined,
  CloseOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
} from '@ant-design/icons';
import axios from 'axios';

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
  storageconditions: number | string | null;
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

interface Category {
  id: number;
  categoryMainId: number;
  categoryName: string;
  categoryCode: string;
  image: string;
  subCategories: any[];
  createdByNavigation: any;
}

interface ProductTableProps {
  PRODUCTS_DATA: Product[];
  handleChangePage: (page: string, productId?: number) => void;
  searchTerm: string;
  categoryFilter: string;
  statusFilter: string;
  minPrice: string;
  maxPrice: string;
  createdByFilter: string;
  manufactureFilter: string;
  dateRange: [string, string] | null;
  usersMap: Map<number, User>;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <h1>Đã xảy ra lỗi. Vui lòng thử lại.</h1>;
    }
    return this.props.children;
  }
}

const ProductTable: React.FC<ProductTableProps> = ({
  PRODUCTS_DATA,
  // handleChangePage,
  searchTerm,
  categoryFilter,
  statusFilter,
  minPrice,
  maxPrice,
  createdByFilter,
  manufactureFilter,
  dateRange,
  usersMap,
}) => {
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState<'list' | 'edit'>('list');
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [form] = Form.useForm();
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'createdDate',
    direction: 'desc',
  });

  const token = localStorage.getItem('accessToken');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch categories for edit form
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/Category/subcategory`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(response.data.data);
      } catch (error) {
        console.error('Lỗi khi lấy danh sách danh mục:', error);
        message.error('Không thể tải danh sách danh mục!');
      }
    };

    if (currentPage === 'edit') {
      fetchCategories();
    }
  }, [currentPage, token]);

  // Sync original products with props and initialize filtered products
  useEffect(() => {
    const validProducts = PRODUCTS_DATA.filter(
      (product) =>
        product.productId !== null &&
        product.productId !== undefined &&
        !isNaN(product.productId) &&
        product.status !== null &&
        product.status !== undefined
    ).map((product) => {
      if (
        product.storageconditions !== null &&
        product.storageconditions !== undefined &&
        typeof product.storageconditions === 'string' &&
        !['Bảo quản thường', 'Bảo quản lạnh', 'Bảo quản mát', '1', '2', '3'].includes(product.storageconditions)
      ) {
        console.warn(`Invalid storageconditions for product ID ${product.productId}:`, product.storageconditions);
      }
      return {
        ...product,
        status: product.status ?? false,
        storageconditions: product.storageconditions ?? 1, // Default to 1 if null
      };
    });

    if (PRODUCTS_DATA.length !== validProducts.length) {
      console.warn('Invalid products detected:', PRODUCTS_DATA.filter((product) => product.productId == null || product.status == null));
    }

    console.log('Processed PRODUCTS_DATA:', validProducts); // Log processed data

    setOriginalProducts(validProducts);
    setCurrentPageNumber(1);
  }, [PRODUCTS_DATA]);

  // Filter products based on props
  useEffect(() => {
    let filtered = [...originalProducts];

    if (searchTerm.trim()) {
      const normalizedSearch = searchTerm
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase();
      filtered = filtered.filter((product) =>
        product.productName
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase()
          .includes(normalizedSearch)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => product.categoryName === categoryFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((product) => (statusFilter === 'true' ? product.status : !product.status));
    }

    if (minPrice !== '' && !isNaN(Number(minPrice))) {
      filtered = filtered.filter((product) => product.sellingPrice >= Number(minPrice));
    }

    if (maxPrice !== '' && !isNaN(Number(maxPrice))) {
      filtered = filtered.filter((product) => product.sellingPrice <= Number(maxPrice));
    }

    if (createdByFilter) {
      filtered = filtered.filter((product) => {
        const user = product.createdBy ? usersMap.get(product.createdBy) : null;
        const username = user ? user.username : 'Không xác định';
        return username === createdByFilter;
      });
    }

    if (manufactureFilter) {
      filtered = filtered.filter((product) => product.manufactureName === manufactureFilter);
    }

    if (dateRange) {
      filtered = filtered.filter((product) => {
        if (!product.createdDate) return false;
        const createdDate = new Date(product.createdDate);
        return createdDate >= new Date(dateRange[0]) && createdDate <= new Date(dateRange[1]);
      });
    }

    const sortedFiltered = sortProducts(filtered, sortConfig.key, sortConfig.direction);
    if (filtered.length !== filteredProducts.length) {
      setCurrentPageNumber(1);
    }
    setFilteredProducts(sortedFiltered);
  }, [
    searchTerm,
    categoryFilter,
    statusFilter,
    minPrice,
    maxPrice,
    createdByFilter,
    manufactureFilter,
    dateRange,
    originalProducts,
    sortConfig,
  ]);

  // Sort products function
  const sortProducts = (products: Product[], key: string, direction: 'asc' | 'desc' | null) => {
    if (!direction) return products;

    return [...products].sort((a, b) => {
      let valueA = a[key as keyof Product];
      let valueB = b[key as keyof Product];

      if (valueA == null) valueA = '';
      if (valueB == null) valueB = '';

      if (key === 'createdDate') {
        const dateA = valueA ? new Date(valueA as string).getTime() : 0;
        const dateB = valueB ? new Date(valueB as string).getTime() : 0;
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (
        key === 'sellingPrice' ||
        key === 'vat' ||
        key === 'weight' ||
        key === 'storageconditions' ||
        key === 'volumePerUnit'
      ) {
        const numA = typeof valueA === 'string' && ['1', '2', '3'].includes(valueA) ? Number(valueA) : Number(valueA);
        const numB = typeof valueB === 'string' && ['1', '2', '3'].includes(valueB) ? Number(valueB) : Number(valueB);
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return 0;
    });
  };

  // Handle sort change
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  // Handle status change
  const handleStatusChange = async (productId: number, newStatus: string) => {
    if (productId == null) {
      console.error('Cannot change status: productId is null');
      message.error('ID sản phẩm không hợp lệ!');
      return;
    }

    const status = newStatus === 'true';
    try {
      const response = await axios.put(
        `${API_BASE_URL}/Product/activate/${productId}?update=${status}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const updatedProducts = originalProducts.map((product) =>
          product.productId === productId ? { ...product, status } : product
        );
        setOriginalProducts(sortProducts(updatedProducts, sortConfig.key, sortConfig.direction));
        setFilteredProducts(sortProducts(updatedProducts, sortConfig.key, sortConfig.direction));
        message.success('Cập nhật trạng thái thành công!');
      } else {
        message.error(response.data.message || 'Cập nhật trạng thái thất bại!');
      }
    } catch (error: any) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      message.error(`Lỗi ${error.response?.status || 'mạng'}: ${error.response?.data.message || 'Không thể cập nhật trạng thái!'}`);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (selectedProduct && selectedProduct.productId != null) {
      const updatedProducts = originalProducts.filter((product) => product.productId !== selectedProduct.productId);
      const validUpdatedProducts = updatedProducts.filter(
        (product) => product.productId !== null && product.productId !== undefined
      );
      setOriginalProducts(sortProducts(validUpdatedProducts, sortConfig.key, sortConfig.direction));
      setFilteredProducts(sortProducts(validUpdatedProducts, sortConfig.key, sortConfig.direction));
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
      setCurrentPageNumber(1);
      message.success('Xóa sản phẩm thành công!');
    } else {
      console.error('Cannot delete: selectedProduct or productId is null');
      setIsDeleteModalOpen(false);
      message.error('Lỗi khi xóa sản phẩm!');
    }
  };

  // Map storage condition to text
  const getStorageConditionText = (value: number | string | null | undefined): string => {
    console.log('storageconditions value:', value); // Log for debugging
    if (value === null || value === undefined) {
      console.warn('storageconditions is null or undefined');
      return 'Không xác định';
    }
  
    // Handle string values
    if (typeof value === 'string') {
      // Normalize the string by removing extra spaces and fixing special characters
      const normalizedValue = value
        .replace(/\s*\(\s*Nhiệt độ:.*?\)\s*$/, '') // Remove temperature/humidity details
        .replace(/\s*<\s*/g, '<') // Fix < symbol
        .replace(/\s*;\s*/g, ';') // Fix semicolon spacing
        .trim();
  
      switch (normalizedValue) {
        case 'Bảo quản thường':
        case '1':
          return 'Bảo quản thường (Nhiệt độ: 15-30°C; Độ ẩm < 75%)';
        case 'Bảo quản lạnh':
        case '2':
          return 'Bảo quản lạnh (Nhiệt độ: 2-8°C; Độ ẩm < 45%)';
        case 'Bảo quản mát':
        case '3':
          return 'Bảo quản mát (Nhiệt độ: 8-15°C; Độ ẩm < 70%)';
        default:
          console.warn('Unexpected storageconditions string:', value);
          return 'Không xác định';
      }
    }
  
    // Handle numeric values
    switch (value) {
      case 1:
        return 'Bảo quản thường (Nhiệt độ: 15-30°C; Độ ẩm < 75%)';
      case 2:
        return 'Bảo quản lạnh (Nhiệt độ: 2-8°C; Độ ẩm < 45%)';
      case 3:
        return 'Bảo quản mát (Nhiệt độ: 8-15°C; Độ ẩm < 70%)';
      default:
        console.warn('Unexpected storageconditions number:', value);
        return 'Không xác định';
    }
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Handle row selection change
  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  // Trong hàm handleEditProduct
const handleEditProduct = (productId: number) => {
  setSelectedProductId(productId);
  setCurrentPage('edit');
  const product = originalProducts.find((p) => p.productId === productId);
  if (product) {
    // Chuẩn hóa storageconditions
    let storageConditionValue = '1'; // Giá trị mặc định
    if (product.storageconditions != null) {
      if (typeof product.storageconditions === 'string') {
        storageConditionValue = {
          'Bảo quản thường': '1',
          'Bảo quản lạnh': '2',
          'Bảo quản mát': '3',
          '1': '1',
          '2': '2',
          '3': '3',
        }[product.storageconditions] || '1';
      } else {
        storageConditionValue = product.storageconditions.toString();
      }
    }

    form.setFieldsValue({
      ...product,
      status: product.status.toString(),
      storageconditions: storageConditionValue,
    });
    setImages(product.images || []);
    setNewImages([]);
  } else {
    console.error(`Product with ID ${productId} not found in originalProducts`);
    setCurrentPage('list');
    message.error('Không tìm thấy sản phẩm để chỉnh sửa');
  }
};

  // Handle remove existing image
  const handleRemoveImage = (imageUrl: string) => {
    setImages(images.filter((img) => img !== imageUrl));
    message.success('Đã xóa ảnh!');
  };

  // Handle image change for new images
  const handleImageChange = (info: any) => {
    const files = info.fileList.map((file: any) => file.originFileObj).filter((file: File) => file);
    const validFiles = files.filter((file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('Chỉ được chọn tệp hình ảnh (JPG, PNG, JPEG)');
        return false;
      }
      return true;
    });
    setNewImages(validFiles);
  };

  // Handle save edited product
  const handleSave = async (values: any) => {
    if (selectedProductId === null) {
      console.error('Cannot save: selectedProductId is null');
      message.error('Lỗi khi lưu sản phẩm: Không tìm thấy ID sản phẩm!');
      setCurrentPage('list');
      return;
    }
  
    if (!token) {
      console.error('No access token found');
      message.error('Vui lòng đăng nhập lại!');
      setCurrentPage('list');
      return;
    }
  
    try {
      // Chuẩn hóa storageconditions
      const storageConditionValue = values.storageconditions || '1';
      if (!['1', '2', '3'].includes(storageConditionValue)) {
        console.error('Invalid storageconditions:', storageConditionValue);
        message.error('Điều kiện bảo quản không hợp lệ!');
        return;
      }
  
      // Validate category
      const selectedProduct = originalProducts.find((p) => p.productId === selectedProductId);
      const categoryName = values.categoryName || selectedProduct?.categoryName || null;
      if (!categoryName) {
        console.error('Invalid categoryName:', values.categoryName);
        message.error('Danh mục không hợp lệ!');
        return;
      }
  
      // Prepare updated product data
      const updatedProduct = {
        productCode: values.productCode?.trim() || '',
        productName: values.productName?.trim() || '',
        manufactureName: values.manufactureName?.trim() || '',
        unit: values.unit?.trim() || '',
        categoryName: categoryName,
        description: values.description?.trim() || '',
        sellingPrice: Number(values.sellingPrice) || 0,
        vat: Number(values.vat) || 0,
        storageconditions: Number(storageConditionValue),
        weight: Number(values.weight) || 0,
        volumePerUnit: Number(values.volumePerUnit) || 0,
        status: values.status === 'true',
        images: images, // Danh sách ảnh hiện tại
      };
  
      // Validate required fields
      if (!updatedProduct.productName) {
        message.error('Tên sản phẩm là bắt buộc!');
        return;
      }
      if (updatedProduct.sellingPrice <= 0) {
        message.error('Giá bán phải lớn hơn 0!');
        return;
      }
      if (updatedProduct.vat < 0 || updatedProduct.vat > 100) {
        message.error('VAT phải từ 0 đến 100%!');
        return;
      }
      if (updatedProduct.weight <= 0) {
        message.error('Trọng lượng phải lớn hơn 0!');
        return;
      }
      if (updatedProduct.volumePerUnit <= 0) {
        message.error('Dung tích phải lớn hơn 0!');
        return;
      }
  
      // Prepare FormData
      const formDataToSend = new FormData();
      formDataToSend.append('productCode', updatedProduct.productCode);
      formDataToSend.append('productName', updatedProduct.productName);
      formDataToSend.append('manufactureName', updatedProduct.manufactureName);
      formDataToSend.append('unit', updatedProduct.unit);
      formDataToSend.append('categoryName', updatedProduct.categoryName.toString());
      formDataToSend.append('description', updatedProduct.description);
      formDataToSend.append('sellingPrice', updatedProduct.sellingPrice.toString());
      formDataToSend.append('vat', updatedProduct.vat.toString());
      formDataToSend.append('storageconditions', updatedProduct.storageconditions.toString());
      formDataToSend.append('weight', updatedProduct.weight.toString());
      formDataToSend.append('volumePerUnit', updatedProduct.volumePerUnit.toString());
      formDataToSend.append('status', updatedProduct.status.toString());
  
      // Gửi danh sách ảnh hiện tại (existingImages)
      if (images.length > 0) {
        images.forEach((img: string) => {
          formDataToSend.append('existingImages', img);
        });
      } else {
        // Gửi một giá trị rỗng để báo cho backend giữ nguyên ảnh cũ
        formDataToSend.append('existingImages', '');
      }
  
      // Gửi ảnh mới (nếu có)
      newImages.forEach((file: File) => {
        formDataToSend.append('images', file);
      });
  
      // Log FormData để kiểm tra
      const formDataEntries: { [key: string]: any } = {};
      formDataToSend.forEach((value, key) => {
        if (key === 'images' || key === 'existingImages') {
          formDataEntries[key] = formDataEntries[key] || [];
          formDataEntries[key].push(value);
        } else {
          formDataEntries[key] = value;
        }
      });
      console.log('Sending FormData:', formDataEntries);
  
      // Gửi yêu cầu PUT
      const response = await axios.put(
        `${API_BASE_URL}/Product/${selectedProductId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      console.log('Update API response:', response.data);
  
      if (response.data.success) {
        // Cập nhật state với danh sách ảnh từ backend, nhưng giữ nguyên nếu backend không trả về ảnh mới
        const updatedImages = response.data.data.images && response.data.data.images.length > 0 ? response.data.data.images : images;
  
        const updatedProducts = originalProducts.map((product) =>
          product.productId === selectedProductId
            ? {
                ...product,
                ...updatedProduct,
                productId: selectedProductId,
                categoryName: values.categoryName,
                images: updatedImages, // Sử dụng danh sách ảnh cập nhật
              }
            : product
        );
        setOriginalProducts(sortProducts(updatedProducts, sortConfig.key, sortConfig.direction));
        setFilteredProducts(sortProducts(updatedProducts, sortConfig.key, sortConfig.direction));
        message.success('Cập nhật sản phẩm thành công!');
        setCurrentPage('list');
        setSelectedProductId(null);
        setImages([]);
        setNewImages([]);
        form.resetFields();
        setCurrentPageNumber(1);
      } else {
        console.error('Update failed:', response.data.message);
        message.error(response.data.message || 'Cập nhật sản phẩm thất bại!');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Cập nhật sản phẩm thất bại. Vui lòng kiểm tra dữ liệu và thử lại!';
      message.error(`Lỗi (400): ${errorMessage}`);
      if (error.response?.data?.errors) {
        console.log('Validation errors:', error.response.data.errors);
      }
    }
  };

  // Custom arrow buttons for Carousel
  const NextArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'block',
          color: '#fff',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          lineHeight: '36px',
          textAlign: 'center',
          fontSize: '18px',
          right: '12px',
          transition: 'background 0.3s',
          cursor: 'pointer',
        }}
        onClick={onClick}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
      >
        <RightOutlined />
      </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: 'block',
          color: '#fff',
          background: 'rgba(0, 0, 0, 0.6)',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          lineHeight: '36px',
          textAlign: 'center',
          fontSize: '18px',
          left: '12px',
          zIndex: 1,
          transition: 'background 0.3s',
          cursor: 'pointer',
        }}
        onClick={onClick}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)')}
      >
        <LeftOutlined />
      </div>
    );
  };

  // Table columns with sort
  const columns = [
    {
      title: (
        <div className="flex items-center">
          Mã sản phẩm
          <Button
            type="text"
            icon={
              sortConfig.key === 'productCode' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('productCode')}
          />
        </div>
      ),
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: (
        <div className="flex items-center">
          Tên sản phẩm
          <Button
            type="text"
            icon={
              sortConfig.key === 'productName' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('productName')}
          />
        </div>
      ),
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: Product) => (
        <div className="flex items-center gap-3">
          <Image
            width={40}
            height={40}
            src={record.images && record.images.length > 0 ? record.images[0] : '/placeholder.png'}
            alt={text || 'N/A'}
            fallback="/placeholder.png"
          />
          <Tooltip title={text || 'N/A'} placement="top">
            <span
              style={{
                display: 'inline-block',
                maxWidth: '150px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {text || 'N/A'}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          Danh mục thuốc
          <Button
            type="text"
            icon={
              sortConfig.key === 'categoryName' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('categoryName')}
          />
        </div>
      ),
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text: string) => text || 'Không có',
    },
    {
      title: (
        <div className="flex items-center">
          Giá bán (VND)
          <Button
            type="text"
            icon={
              sortConfig.key === 'sellingPrice' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('sellingPrice')}
          />
        </div>
      ),
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      render: (price: number) => `${price ? price.toLocaleString() : '0'} `,
    },
    {
      title: (
        <div className="flex items-center">
          Trạng thái
          <Button
            type="text"
            icon={
              sortConfig.key === 'status' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('status')}
          />
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      render: (status: boolean | null | undefined, record: Product) => (
        <Select
          value={status != null ? status.toString() : 'false'}
          onChange={(value) => handleStatusChange(record.productId, value)}
          style={{ width: 120 }}
        >
          <Option value="true">Đang bán</Option>
          <Option value="false">Ngừng bán</Option>
        </Select>
      ),
    },
    {
      title: (
        <div className="flex items-center">
          Ngày tạo
          <Button
            type="text"
            icon={
              sortConfig.key === 'createdDate' ? (
                sortConfig.direction === 'asc' ? (
                  <SortAscendingOutlined />
                ) : (
                  <SortDescendingOutlined />
                )
              ) : null
            }
            onClick={() => handleSort('createdDate')}
          />
        </div>
      ),
      dataIndex: 'createdDate',
      key: 'createdDate',
      render: (date: string | null) => formatDate(date),
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'Xem chi tiết',
                icon: <EyeOutlined />,
                onClick: () => {
                  setSelectedProduct(record);
                  setIsDetailModalOpen(true);
                },
              },
              {
                key: 'edit',
                label: 'Chỉnh sửa',
                icon: <EditOutlined />,
                onClick: () => handleEditProduct(record.productId),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button shape="circle" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Handle page change
  const onPageChange = (page: number) => {
    setCurrentPageNumber(page);
  };

  // Render list page
  const renderListPage = () => {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey={(record) => record.productId?.toString() ?? `fallback-${record.productCode ?? Math.random()}`}
          rowSelection={{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
          }}
          pagination={{
            pageSize: 10,
            current: currentPageNumber,
            onChange: onPageChange,
            total: filteredProducts.length,
          }}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          title="Xác nhận xóa"
          open={isDeleteModalOpen}
          onOk={handleDelete}
          onCancel={() => setIsDeleteModalOpen(false)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <p>Bạn có chắc chắn muốn xóa sản phẩm này không?</p>
        </Modal>

        {/* Product Details Modal */}
        {selectedProduct && (
          <Modal
            title={
              <h2 className="text-2xl font-semibold text-gray-800">{selectedProduct.productName || 'Chi tiết sản phẩm'}</h2>
            }
            open={isDetailModalOpen}
            onCancel={() => setIsDetailModalOpen(false)}
            footer={null}
            width={1000}
            bodyStyle={{ padding: '24px' }}
            className="rounded-lg"
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Carousel Section */}
              <div className="w-full md:w-1/2">
                <Carousel
                  arrows
                  prevArrow={<PrevArrow />}
                  nextArrow={<NextArrow />}
                  dots={{ className: 'custom-dots' }}
                  style={{
                    background: '#fafafa',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    overflow: 'hidden',
                  }}
                >
                  {selectedProduct.images && selectedProduct.images.length > 0 ? (
                    selectedProduct.images.map((img, index) => (
                      <div key={index} className="flex justify-center items-center">
                        <Image
                          src={img}
                          alt={`${selectedProduct.productName} - ${index}`}
                          style={{
                            maxHeight: '400px',
                            maxWidth: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            margin: '0 auto',
                          }}
                          preview={true}
                          fallback="/placeholder.png"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center items-center">
                      <Image
                        src="/placeholder.png"
                        alt="No image"
                        style={{
                          maxHeight: '400px',
                          maxWidth: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          margin: '0 auto',
                        }}
                        preview={false}
                      />
                    </div>
                  )}
                </Carousel>
              </div>

              {/* Product Info Section */}
              <div className="w-full md:w-1/2 flex flex-col gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Thông tin sản phẩm</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Mã sản phẩm:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.productCode || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Hãng sản xuất:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.manufactureName || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Danh mục:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.categoryName || 'Không có'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Đơn vị:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.unit || 'Không xác định'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Giá bán:</span>
                      <p className="text-gray-600 mt-1 font-semibol">
                        {selectedProduct.sellingPrice?.toLocaleString() || '0'} VND
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Thuế VAT:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.vat != null ? `${selectedProduct.vat}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Trọng lượng:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.weight != null ? `${selectedProduct.weight} kg` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Dung tích:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.volumePerUnit != null ? `${selectedProduct.volumePerUnit} cm³` : 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Điều kiện bảo quản:</span>
                      <p className="text-gray-600 mt-1">{getStorageConditionText(selectedProduct.storageconditions)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Người tạo:</span>
                      <p className="text-gray-600 mt-1">
                        {selectedProduct.createdBy ? usersMap.get(selectedProduct.createdBy)?.username || 'Không xác định' : 'Không xác định'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Trạng thái:</span>
                      <p className={`text-gray-600 mt-1 font-semibold ${selectedProduct.status ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedProduct.status ? 'Đang bán' : 'Ngừng bán'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Ngày tạo:</span>
                      <p className="text-gray-600 mt-1">{selectedProduct.createdDate ? new Date(selectedProduct.createdDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Mô tả sản phẩm</h3>
                  <div
                    className="text-gray-600 text-sm"
                    style={{
                      maxHeight: '150px',
                      overflowY: 'auto',
                      paddingRight: '8px',
                    }}
                  >
                    {selectedProduct.description || 'Không có mô tả'}
                  </div>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  };

  // Render edit page
  const renderEditPage = () => (
    <div className="p-6 flex justify-center">
      <Card title="Chỉnh sửa sản phẩm" className="w-full max-w-4xl">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã sản phẩm" name="productCode">
                <Input disabled />
              </Form.Item>
              <Form.Item
                label="Tên sản phẩm"
                name="productName"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item label="Nhà cung cấp" name="manufactureName">
                <Input />
              </Form.Item>
              <Form.Item label="Đơn vị" name="unit">
                <Input />
              </Form.Item>
              <Form.Item label="Danh mục" name="categoryName">
                <Select placeholder="Chọn danh mục">
                  {categories.map((category) => (
                    <Option key={category.id} value={category.categoryName}>
                      {category.categoryName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá bán"
                name="sellingPrice"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
              >
                <InputNumber className="w-full" min={0} addonAfter="VND" />
              </Form.Item>
              <Form.Item label="Thuế VAT" name="vat">
                <InputNumber className="w-full" min={0} max={100} addonAfter="%" />
              </Form.Item>
              <Form.Item label="Trọng lượng" name="weight">
                <InputNumber className="w-full" min={0} step={0.1} addonAfter="kg" />
              </Form.Item>
              <Form.Item label="Dung tích" name="volumePerUnit">
                <InputNumber className="w-full" min={0} step={0.1} addonAfter="cm³" />
              </Form.Item>
              <Form.Item
  label="Điều kiện bảo quản"
  name="storageconditions"
  rules={[{ required: true, message: 'Vui lòng chọn điều kiện bảo quản' }]}
>
  <Select placeholder="Chọn điều kiện bảo quản">
    <Option value="1">Bảo quản thường (Nhiệt độ: 15-30°C; Độ ẩm &lt; 75%)</Option>
    <Option value="2">Bảo quản lạnh (Nhiệt độ: 2-8°C; Độ ẩm &lt; 45%)</Option>
    <Option value="3">Bảo quản mát (Nhiệt độ: 8-15°C; Độ ẩm &lt; 70%)</Option>
  </Select>
</Form.Item>
              <Form.Item label="Trạng thái" name="status">
                <Select>
                  <Option value="true">Đang bán</Option>
                  <Option value="false">Ngừng bán</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item label="Ảnh sản phẩm">
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={img}
                      alt={`Product image ${index}`}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover', borderRadius: '4px' }}
                      fallback="/placeholder.png"
                    />
                    <Button
                      icon={<CloseOutlined />}
                      shape="circle"
                      size="small"
                      danger
                      style={{ position: 'absolute', top: '-10px', right: '-10px' }}
                      onClick={() => handleRemoveImage(img)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">Chưa có ảnh nào.</p>
            )}

            <Upload
              name="images"
              listType="picture"
              showUploadList={false}
              multiple={true}
              beforeUpload={() => false}
              onChange={handleImageChange}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
            </Upload>

            {newImages.length > 0 && (
              <div className="flex flex-wrap gap-4 mt-4">
                {newImages.map((file, index) => (
                  <Image
                    key={index}
                    src={URL.createObjectURL(file)}
                    alt={`New image ${index}`}
                    width={100}
                    height={100}
                    style={{ objectFit: 'cover', borderRadius: '4px' }}
                  />
                ))}
              </div>
            )}
          </Form.Item>

          <Form.Item>
            <div className="flex gap-4">
              <Button type="primary" htmlType="submit">
                Lưu
              </Button>
              <Button
                onClick={() => {
                  setCurrentPage('list');
                  setSelectedProductId(null);
                  setImages([]);
                  setNewImages([]);
                  form.resetFields();
                }}
                danger
              >
                Hủy
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  return (
    <ErrorBoundary>
      {currentPage === 'list' ? renderListPage() : renderEditPage()}
    </ErrorBoundary>
  );
};

export default ProductTable;