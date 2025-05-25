import React, { useState, useEffect, useRef } from "react";

interface SubCategory {
  id: number;
  name: string;
  parentCategory: string;
  code: string;
  createdBy: string;
  image?: string;
}

interface UpdateSubCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  subCategory: SubCategory | null;
  onSave: (updatedSubCategory: SubCategory) => void;
}

const UpdateSubCategory: React.FC<UpdateSubCategoryProps> = ({ isOpen, onClose, subCategory, onSave }) => {
  const [formData, setFormData] = useState<SubCategory>({
    id: 0,
    name: "",
    parentCategory: "",
    code: "",
    createdBy: "",
    image: "",
  });

  const [previewImage, setPreviewImage] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subCategory) {
      setFormData(subCategory);
      setPreviewImage(subCategory.image || "assets/img/product/noimage.png");
    }
  }, [subCategory]);

  if (!isOpen || !subCategory) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);  // Hiển thị ảnh ngay lập tức
        setFormData({ ...formData, image: reader.result as string }); // Cập nhật formData
      };
      reader.readAsDataURL(file);
    }
  }

  const handleSave = () => {
    onSave(formData);  // Cập nhật ảnh trong danh sách
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative">
        <h2 className="text-lg font-semibold mb-4">Cập nhật danh mục thuốc</h2>

        {showSuccess && (
          <div className="bg-green-500 text-white px-4 py-2 rounded-md text-center mb-3">
            Cập nhật thành công!
          </div>
        )}

        <div className="mb-4 text-center">
          <label className="block text-sm font-medium">Hình ảnh</label>
          <div className="flex justify-center">
            <img
              src={previewImage}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-md border cursor-pointer hover:opacity-80 transition"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Mã danh mục</label>
          <input type="text" name="code" value={formData.code} onChange={handleChange} className="w-full p-2 border rounded-md" />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium">Tên danh mục thuốc</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" />
        </div>


        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded-md">Hủy</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md">Lưu</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateSubCategory;