import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CategoryTable from '../../components/Category/CategoryTable';
import { useAuth } from '../Home/AuthContext'; // Giả sử cần token để gọi API

interface CategoryListPageProps {
  handleChangePage: (page: string) => void;
}

interface Category {
  id: number;
  name: string;
  code: string;
  createdBy: string;
  image?: string;
}

const CategoryList: React.FC<CategoryListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Hàm lấy chủng loại từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_BASE_URL}/Category/tree`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        // Chuyển đổi dữ liệu cây thành danh sách phẳng để khớp với giao diện Category
        const flattenedCategories: Category[] = response.data.data.map((cat: any) => ({
          id: cat.id,
          name: cat.categoryName,
          code: cat.categoryCode,
          createdBy: user?.username || 'Không xác định', // Sử dụng username từ AuthContext
          image: cat.image,
        })).sort((a: Category, b: Category) => b.id - a.id); // Sắp xếp mới nhất lên đầu theo id
        setCategories(flattenedCategories);
      } else {
        console.error('Không thể lấy chủng loại:', response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi lấy chủng loại:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chủng loại</h1>
          <p className="font-semibold text-gray-600">Quản lý danh sách chủng loại</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <CategoryTable
            CATEGORY_DATA={categories}
            handleChangePage={handleChangePage}
          />
        )}
      </div>
    </div>
  );
};

export default CategoryList;