import React, { useState, useEffect } from "react";
import SubCategoryTable from "../../components/Category/SubCategoryTable"; // Điều chỉnh đường dẫn theo cấu trúc dự án
import {  message } from "antd";
import axios from "axios";
import { useAuth } from '../Home/AuthContext'; // Giả sử bạn có AuthContext để lấy token

interface SubCategory {
  id: number;
  name: string;
  parentCategory: string;
  categoryMainId: number;
  code: string;
  description: string;
  createdBy: string;
  image?: string;
}

interface SubCategoryListPageProps {
  handleChangePage: (page: string, subCategoryId?: number) => void;
}

const SubCategoryList: React.FC<SubCategoryListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Lấy danh sách danh mục phụ từ API
  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/Category/subcategory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const categories = response.data.data
          .map((cat: any) => ({
            id: cat.id,
            name: cat.categoryName.trim(),
            code: cat.categoryCode,
            categoryMainId: cat.categoryMainId,
            parentCategory: "",
            description: "",
            createdBy: user?.username || "Không xác định",
            image: cat.image,
          }))
          .sort((a: SubCategory, b: SubCategory) => b.id - a.id); // Sắp xếp mới nhất lên đầu theo id
        setSubCategories(categories);
      } else {
        message.error("Không thể lấy danh mục phụ: " + response.data.message);
      }
    } catch (error) {
      message.error("Lỗi khi lấy danh mục phụ!");
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách danh mục chính để ánh xạ parentCategory
  const fetchMainCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Category/tree`, {
        headers: { Accept: "*/*" },
      });
      if (response.data.success) {
        const mainCategories = response.data.data.reduce((acc: any, cat: any) => {
          acc[cat.id] = cat.categoryName;
          return acc;
        }, {});
        setSubCategories((prev) =>
          prev.map((sub) => ({
            ...sub,
            parentCategory: mainCategories[sub.categoryMainId] || "Không xác định",
          }))
        );
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh mục chính:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubCategories();
    }
  }, [user]);

  useEffect(() => {
    if (subCategories.length > 0) {
      fetchMainCategories();
    }
  }, [subCategories]);

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh mục thuốc</h1>
          <p className="font-semibold text-gray-600">Quản lý danh sách danh mục thuốc</p>
        </div>
        {/* <Button
          type="primary"
          onClick={() => handleChangePage("Tạo danh mục thuốc")}
        >
          + Tạo danh mục thuốc mới
        </Button> */}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <SubCategoryTable
            SUBCATEGORY_DATA={subCategories}
            handleChangePage={handleChangePage}
          />
        )}
      </div>
    </div>
  );
};

export default SubCategoryList;