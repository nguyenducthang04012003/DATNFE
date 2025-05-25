import React from "react";
import { Modal, Image } from "antd";

interface Product {
  ProductId: number;
  ProductCode: string;
  ManufactureName: string;
  ProductName: string;
  UnitId: number;
  CategoryId: number;
  Description: string;
  SellingPrice: number;
  CreatedBy: string;
  CreatedDate: string;
  Status: string;
  VAT: number;
  StorageConditions: string;
  Weight: number;
  Image?: string;
  CategoryName?: string;
  SubCategoryName?: string;
  UnitName?: string;
}

interface ProductDetailProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ProductDetailsModal: React.FC<ProductDetailProps> = ({ isOpen, onClose, product }) => {
  if (!product) return null;

  return (
    <Modal
      title="Chi tiết sản phẩm"
      open={isOpen}
      onCancel={onClose}
      footer={null}
    >
      <div className="flex flex-col space-y-3">
        <Image width={100} src={product.Image || "/placeholder.png"} alt={product.ProductName} />
        
        <p><strong>Tên:</strong> {product.ProductName}</p>
        <p><strong>Mã:</strong> {product.ProductCode}</p>
        <p><strong>Hãng:</strong> {product.ManufactureName}</p>
        <p><strong>Mô tả:</strong> {product.Description}</p>
        <p><strong>Điều kiện bảo quản:</strong> {product.StorageConditions}</p>
        <p><strong>Trọng lượng:</strong> {product.Weight} kg</p>
        <p><strong>Danh mục chính:</strong> {product.CategoryName || "Không có"}</p>
        <p><strong>Danh mục thuốc:</strong> {product.SubCategoryName || "Không có"}</p>
        <p><strong>Đơn vị:</strong> {product.UnitName || "Không xác định"}</p>
        <p><strong>Giá:</strong> {product.SellingPrice.toLocaleString()} VND</p>
        <p><strong>VAT:</strong> {product.VAT}%</p>
        <p><strong>Trạng thái:</strong> {product.Status}</p>
      </div>
    </Modal>
  );
};

export default ProductDetailsModal;
