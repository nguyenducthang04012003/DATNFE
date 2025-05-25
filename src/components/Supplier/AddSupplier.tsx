
import { Form, Input, Button, Select, message } from "antd";
import axios from "axios";

const { Option } = Select;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function AddSupplier() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onFinish = async (values: any) => {
    console.log("Success:", values);
    
    try {
      // Gọi API để tạo nhà cung cấp
      const response = await axios.post(`${API_BASE_URL}/Supplier/CreateSupplier`, values);

      if (response.data.success) {
        message.success("Nhà cung cấp đã được tạo mới!");
        // Reset form hoặc làm gì đó sau khi thành công
      } else {
        message.error(response.data.message || "Có lỗi xảy ra!");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        message.error(error.response?.data.message || "Có lỗi xảy ra!");
      } else {
        message.error("Lỗi không xác định!");
      }
    }
  };

  return (
    <div className="p-6 w-full transition-all rounded-lg shadow-sm mt-[60px] bg-[#fafbfe]">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tạo mới nhà cung cấp</h1>
        <p className="text-sm text-gray-500">Tạo mới nhà cung cấp theo form bên dưới</p>
      </div>

      <div className="p-5 bg-white rounded-lg shadow w-full max-w-7xl mx-auto">
        <Form layout="vertical" onFinish={onFinish}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Form.Item
              label="Mã nhà cung cấp"
              name="supplierCode"
              rules={[{ required: true, message: "Vui lòng nhập mã nhà cung cấp!" }]}
            >
            <Input placeholder="Nhập tên nhà cung cấp" />
            </Form.Item>
            <Form.Item
              label="Tên nhà cung cấp"
              name="supplierName"
              rules={[{ required: true, message: "Vui lòng nhập tên nhà cung cấp!" }]}
            >
              <Input placeholder="Nhập tên nhà cung cấp" />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="supplierPhone"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
            >
              <Input type="tel" placeholder="Nhập số điện thoại" />
            </Form.Item>

            <Form.Item
              label="Địa chỉ"
              name="supplierAddress"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Form.Item
              label="Trạng thái"
              name="status"
              rules={[{ required: true, message: "Vui lòng chọn trạng thái!" }]}
            >
              <Select placeholder="Tùy chỉnh trạng thái">
              <Option value={true}>Hoạt động</Option>
              <Option value={false}>Không hoạt động</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="default" htmlType="button" onClick={() => message.info("Đã hủy!")}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Lưu
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}