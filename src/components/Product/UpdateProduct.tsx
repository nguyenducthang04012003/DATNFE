import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Select, Upload, Button, Card, message, Row, Col } from "antd";
import { UploadOutlined } from "@ant-design/icons";

interface UpdateProductProps {
  productId: number;
  handleChangePage: (page: string) => void;
}

const { Option } = Select;

const UpdateProduct: React.FC<UpdateProductProps> = ({ productId, handleChangePage }) => {
  const [form] = Form.useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    import("../data/product").then((module) => {
      const PRODUCTS_DATA = module.PRODUCTS_DATA;
      const foundProduct = PRODUCTS_DATA.find((p) => p.ProductId === productId);
      if (foundProduct) {
        form.setFieldsValue(foundProduct);
        setImagePreview(foundProduct.Image || null);
      }
    });
  }, [productId, form]);

  const handleImageChange = (info: any) => {
    const file = info.fileList[0]?.originFileObj;
    if (file) {
      const isImage = file.type.startsWith("image/");
      if (!isImage) {
        message.error("Chỉ được chọn tệp hình ảnh (JPG, PNG, JPEG)");
        return;
      }

      // Giải phóng URL cũ (nếu có)
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }

      // Cập nhật ảnh mới ngay lập tức
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
    }
  };

  const handleSave = (values: any) => {
    console.log("Dữ liệu đã chỉnh sửa:", values);
    message.success("Sản phẩm đã được cập nhật!");
    handleChangePage("Danh sách sản phẩm");
  };

  return (
    <div className="p-6 flex justify-center">
      <Card title="Chỉnh sửa sản phẩm" className="w-full max-w-4xl">
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã sản phẩm" name="ProductCode">
                <Input disabled />
              </Form.Item>
              <Form.Item label="Tên sản phẩm" name="ProductName" rules={[{ required: true, message: "Vui lòng nhập tên sản phẩm" }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Nhà cung cấp" name="ManufactureName">
                <Input />
              </Form.Item>
              <Form.Item label="Đơn vị" name="UnitName">
                <Input />
              </Form.Item>
              <Form.Item label="Danh mục chính" name="CategoryName">
                <Input />
              </Form.Item>
              <Form.Item label="Danh mục phụ" name="SubCategoryName">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Giá bán" name="SellingPrice" rules={[{ required: true, message: "Vui lòng nhập giá bán" }]}>
                <InputNumber className="w-full" min={0} addonAfter="VND" />
              </Form.Item>
              <Form.Item label="Thuế VAT" name="VAT">
                <InputNumber className="w-full" min={0} max={100} addonAfter="%" />
              </Form.Item>
              <Form.Item label="Trọng lượng" name="Weight">
                <InputNumber className="w-full" min={0} step={0.1} addonAfter="kg" />
              </Form.Item>
              <Form.Item label="Trạng thái" name="Status">
                <Select>
                  <Option value="Đang bán">Đang bán</Option>
                  <Option value="Ngừng bán">Ngừng bán</Option>
                </Select>
              </Form.Item>
              
            </Col>
          </Row>

          <Form.Item label="Mô tả" name="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Điều kiện bảo quản" name="StorageConditions">
            <Input.TextArea rows={3} />
          </Form.Item>

          {/* Ảnh sản phẩm */}
          <Form.Item label="Ảnh sản phẩm">
            {imagePreview && <img src={imagePreview} alt="Product" className="mb-2 w-40 h-40 object-cover rounded-md" />}
            <Upload
              name="Image"
              listType="picture"
              showUploadList={false}
              beforeUpload={() => false} // Ngăn upload lên server
              onChange={handleImageChange}
            >
              <Button icon={<UploadOutlined />}>Chọn ảnh mới</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <div className="flex  gap-4">
              <Button type="primary" htmlType="submit">Lưu</Button>
              <Button onClick={() => handleChangePage("Danh sách sản phẩm")} danger>Hủy</Button>
            </div>
          </Form.Item>

          
        </Form>
      </Card>
    </div>
  );
};

export default UpdateProduct;
