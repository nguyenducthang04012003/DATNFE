import React, { useState, useEffect } from "react";
import {
  Table,
  Select,
  Button,
  Modal,
  Input,
  Collapse,
  DatePicker,
  Dropdown,
  Menu,
  message,
} from "antd";
import {
  EyeOutlined,
  FilterOutlined,
  PrinterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { RangePicker } = DatePicker;
const { Panel } = Collapse;
const { Option } = Select;

interface Supplier {
  id: number;
  supplierName: string;
  supplierCode: string;
  supplierAddress: string;
  supplierPhone: string;
  status: boolean;
  createdBy: number;
  createdDate: string;
}

interface Product {
  productId: number;
  productCode: string;
  manufactureName: string;
  productName: string;
  unit: string;
  categoryId: number;
  description: string;
  sellingPrice: number;
  createdBy: number;
  createdDate: string | null;
  status: boolean;
  vat: number;
  storageconditions: number;
  weight: number;
}

interface PurchaseOrderDetail {
  purchaseOrderDetailId: number;
  purchaseOrderId: number;
  productId: number;
  quantity: number;
  supplyPrice: number;
  product: Product;
}

interface PurchaseOrder {
  purchaseOrderId: number;
  purchaseOrderCode: string;
  supplierId: number | null;
  updatedStatusDate: string;
  totalAmount: number;
  status: number;
  createdBy: string | null;
  createDate: string;
  amountPaid: number | null;
  supplier: Supplier | null;
  products?: PurchaseOrderDetail[];
}

interface StockStatus {
  productId: number;
  productName: string;
  orderedQuantity: number;
  receivedQuantity: number;
  shortageQuantity: number;
}

interface PurchaseOrderTableProps {
  handleChangePage: (page: string, purchaseOrderId?: number) => void;
  onDelete: (id: number) => void;
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: PurchaseOrder[]) => void;
  };
  onRefreshPurchaseOrders?: () => void;
}

const PurchaseOrderTable: React.FC<PurchaseOrderTableProps> = ({
  handleChangePage,
  // onDelete,
  rowSelection,
  onRefreshPurchaseOrders,
}) => {
  const [filteredOrders, setFilteredOrders] = useState<PurchaseOrder[]>([]);
  const [allOrders, setAllOrders] = useState<PurchaseOrder[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isStockStatusModalOpen, setIsStockStatusModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [stockStatus, setStockStatus] = useState<StockStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Hàm lấy danh sách đơn hàng
  const fetchPurchaseOrders = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_BASE_URL}/PurchaseOrders/GetPurchaseOrdersList`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAllOrders(response.data.data || []);
      setFilteredOrders(response.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách đơn đặt hàng:", error);
      message.error("Không thể tải danh sách đơn đặt hàng!");
    }
  };

  // Hàm lấy tình trạng nhập hàng
  const fetchStockStatus = async (id: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      // Gọi API CheckReceivedStockStatus trước
      const stockResponse = await axios.get(
        `${API_BASE_URL}/PurchaseOrders/CheckReceivedStockStatus/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      let stockData = stockResponse.data.data || [];

      // Nếu API trả về mảng rỗng (có thể là đơn hàng đã hoàn thành), lấy chi tiết đơn hàng
      if (stockData.length === 0) {
        const orderResponse = await axios.get(
          `${API_BASE_URL}/PurchaseOrders/GetPurchaseOrderDetailByPoId/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const orderDetails = orderResponse.data.data || [];
        stockData = orderDetails.map((detail: PurchaseOrderDetail) => ({
          productId: detail.productId,
          productName: detail.product.productName,
          orderedQuantity: detail.quantity,
          receivedQuantity: detail.quantity,
          shortageQuantity: 0,
        }));
      }

      setStockStatus(stockData);
      setIsStockStatusModalOpen(true);
    } catch (error) {
      console.error(`Lỗi khi lấy tình trạng nhập hàng cho đơn hàng ${id}:`, error);
      message.error("Không thể tải tình trạng nhập hàng!");
    }
  };

  // Gọi fetchPurchaseOrders khi component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Làm mới dữ liệu khi onRefreshPurchaseOrders được gọi
  useEffect(() => {
    if (onRefreshPurchaseOrders) {
      fetchPurchaseOrders();
      // Nếu modal tình trạng nhập hàng đang mở, làm mới stockStatus
      if (isStockStatusModalOpen && selectedOrder) {
        fetchStockStatus(selectedOrder.purchaseOrderId);
      }
    }
  }, [onRefreshPurchaseOrders, isStockStatusModalOpen, selectedOrder]);

  // Lọc và sắp xếp đơn hàng
  useEffect(() => {
    let filteredData = [...allOrders];

    if (searchTerm.trim()) {
      filteredData = filteredData.filter(
        (order) =>
          order.purchaseOrderCode
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (order.supplier?.supplierName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filteredData = filteredData.filter(
        (order) => String(order.status) === statusFilter
      );
    }

    if (dateRange) {
      filteredData = filteredData.filter((order) => {
        const orderDate = new Date(order.createDate);
        return (
          orderDate >= new Date(dateRange[0]) &&
          orderDate <= new Date(dateRange[1])
        );
      });
    }

    filteredData.sort(
      (a, b) =>
        new Date(b.createDate).getTime() - new Date(a.createDate).getTime()
    );

    setFilteredOrders(filteredData);
  }, [searchTerm, statusFilter, dateRange, allOrders]);

  // Lấy chi tiết đơn hàng
  const fetchOrderDetail = async (id: number, callback?: (order: PurchaseOrder) => void) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_BASE_URL}/PurchaseOrders/GetPurchaseOrderDetailByPoId/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const orderDetails = allOrders.find((order) => order.purchaseOrderId === id);
      if (orderDetails) {
        const detailedOrder = {
          ...orderDetails,
          products: response.data.data || [],
        };
        if (callback) {
          callback(detailedOrder);
        } else {
          setSelectedOrder(detailedOrder);
          setIsDetailModalOpen(true);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
      message.error("Không thể tải chi tiết đơn hàng!");
    }
  };

  const printTable = (order: PurchaseOrder) => {
    if (!order) {
      message.error("Không có đơn hàng để in.");
      return;
    }

    const printContents = `
      <html>
        <head>
          <title>In Đơn Đặt Hàng</title>
          <style>
            body { font-family: 'Arial', sans-serif; margin: 20px; font-size: 12pt; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 14pt; margin: 5px 0; text-transform: uppercase; }
            .header h2 { font-size: 12pt; margin: 5px 0; font-weight: normal; }
            .order-info { margin-bottom: 20px; }
            .order-info p { margin: 5px 0; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .table th, .table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .table th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; }
            .section { margin-top: 20px; }
            .section p { margin: 5px 0; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature { text-align: center; }
            .signature p { margin: 5px 0; }
            @media print {
              .container { margin: 0; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h1>
              <h2>Độc lập - Tự do - Hạnh phúc</h2>
              <h2>SOCIALIST REPUBLIC OF VIETNAM</h2>
              <h2>Independence - Freedom - Happiness</h2>
            </div>
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="font-size: 16pt; text-transform: uppercase;">ĐƠN ĐẶT HÀNG / ORDER</h1>
              <p>Số: ${order.purchaseOrderCode}</p>
            </div>
            <div class="order-info">
              <p><strong>Kính gửi / Kindly attention:</strong> Công ty cổ phần dược phẩm Vinh Nguyên</p>
              <h3>THÔNG TIN KHÁCH HÀNG / Customer Information</h3>
              <p><strong>Tên khách hàng / Customer name:</strong> Công ty cổ phần dược phẩm Vinh Nguyên</p>
              <p><strong>Địa chỉ / Address:</strong> Số 15 lô 8 Khu Đô thị Mỗ lao, Phường Mộ Lao, Quận Hà Đông, Thành phố Hà Nội, Việt Nam</p>
              <p><strong>MST / Tax code:</strong> 0106195140</p>
            </div>
            <h3>ĐẶT HÀNG / Order</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>STT / No</th>
                  <th>Mã hàng / Item code</th>
                  <th>Tên hàng / Product Name</th>
                  <th>Đơn vị / Unit</th>
                  <th>SL / Quantity</th>
                  <th>Đơn giá / Price</th>
                  <th>Thành tiền (+VAT) / Amount (+VAT)</th>
                </tr>
              </thead>
              <tbody>
                ${
                  order.products?.length
                    ? order.products
                        .map(
                          (detail, idx) => `
                          <tr>
                            <td>${idx + 1}</td>
                            <td>${detail.product.productCode || "N/A"}</td>
                            <td>${detail.product.productName}</td>
                            <td>${detail.product.unit || "N/A"}</td>
                            <td>${detail.quantity.toLocaleString("vi-VN")}</td>
                            <td>${detail.supplyPrice.toLocaleString("vi-VN")}</td>
                            <td>${(detail.quantity * detail.supplyPrice).toLocaleString(
                              "vi-VN"
                            )}</td>
                          </tr>
                        `
                        )
                        .join("")
                    : '<tr><td colspan="7">Không có sản phẩm</td></tr>'
                }
              </tbody>
            </table>
            <p class="total">Tổng cộng (Giá trị đơn hàng) / Total (Order value): ${order.totalAmount.toLocaleString(
              "vi-VN"
            )} VND</p>
            <div class="section">
              <h3>NƠI NHẬN HÀNG / Ship to</h3>
              <p><strong>Địa chỉ / Address:</strong> </p>
              <p><strong>Thời gian nhận hàng / Time:</strong> </p>
              <p><strong>Phương tiện vận chuyển / Delivery means:</strong> </p>
              <p><strong>Chi phí vận chuyển / Delivery fee:</strong> </p>
            </div>
            <div class="signatures">
              <div class="signature">
                <p><strong>ĐƠN VỊ ĐẶT HÀNG / ORDERED BY</strong></p>
                <p>CÔNG TY / COMPANY: Công ty cổ phần dược phẩm Vinh Nguyên</p>
                <p>Ngày tháng / Date: ${new Date().toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}</p>
              </div>
              <div class="signature">
                <p><strong>XÁC NHẬN ĐƠN HÀNG / CONFIRMED BY</strong></p>
                <p>CÔNG TY / COMPANY: ${
                  order.supplier?.supplierName || "____________________"
                }</p>
                <p>Ngày tháng / Date: ${new Date().toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow) {
      printWindow.document.write(printContents);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN");

  const columns = [
    {
      title: "Mã Đơn",
      dataIndex: "purchaseOrderCode",
      key: "purchaseOrderCode",
    },
    {
      title: "Nhà Cung Cấp",
      dataIndex: "supplier",
      key: "supplier",
      render: (supplier: Supplier | null) => supplier?.supplierName || "N/A",
    },
    {
      title: "Ngày Đặt",
      dataIndex: "createDate",
      key: "createDate",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `${amount.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) =>
        ["Hủy", "Chờ nhập hàng", "Thiếu hàng", "Hoàn thành"][status] ||
        "Không xác định",
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: PurchaseOrder) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => fetchOrderDetail(record.purchaseOrderId)}
              >
                Xem chi tiết
              </Menu.Item>
              <Menu.Item
                key="print"
                icon={<PrinterOutlined />}
                onClick={() =>
                  fetchOrderDetail(record.purchaseOrderId, (order) =>
                    printTable(order)
                  )
                }
              >
                In đơn hàng
              </Menu.Item>
              <Menu.Item
                key="createReceivedNote"
                icon={<EyeOutlined />}
                onClick={() =>
                  handleChangePage("Tạo phiếu nhập kho", record.purchaseOrderId)
                }
              >
                Tạo phiếu nhập kho
              </Menu.Item>
            </Menu>
          }
          trigger={["click"]}
        >
          <Button shape="circle" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Tìm kiếm theo mã đơn hoặc nhà cung cấp"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 250 }}
        />
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Lọc
        </Button>
      </div>

      {showFilters && (
        <Collapse defaultActiveKey={["1"]}>
          <Panel header="Bộ lọc nâng cao" key="1">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              <Select
                placeholder="Trạng thái"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: "100%" }}
                allowClear
              >
                <Option value="">Tất cả trạng thái</Option>
                <Option value="0">Hủy</Option>
                <Option value="1">Chờ nhập hàng</Option>
                <Option value="2">Thiếu hàng</Option>
                <Option value="3">Hoàn thành</Option>
              </Select>
              <div className="col-span-2">
                <span style={{ marginRight: 8 }}>Lọc theo ngày đặt hàng</span>
                <RangePicker
                  onChange={(_, dateStrings) =>
                    setDateRange(
                      dateStrings.length === 2
                        ? (dateStrings as [string, string])
                        : null
                    )
                  }
                  style={{ width: "100%" }}
                />
              </div>
              <div className="col-span-2">
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setDateRange(null);
                    setFilteredOrders(allOrders);
                  }}
                  style={{ width: "100%", marginTop: "10px" }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </Panel>
        </Collapse>
      )}

      <Table
        columns={columns}
        dataSource={filteredOrders}
        rowKey="purchaseOrderId"
        rowSelection={rowSelection}
      />

      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">
            Chi tiết Đơn hàng: {selectedOrder?.purchaseOrderCode}
          </div>
        }
        open={isDetailModalOpen}
        onCancel={() => setIsDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalOpen(false)}>
            Đóng
          </Button>,
          <Button
            key="checkStock"
            type="primary"
            onClick={() =>
              selectedOrder && fetchStockStatus(selectedOrder.purchaseOrderId)
            }
            className="bg-blue-500"
          >
            Kiểm tra tình trạng nhập hàng
          </Button>,
        ]}
        width={900}
        centered
        bodyStyle={{ padding: "24px", background: "#f9fafb" }}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Thông tin chung
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Mã Đơn</p>
                  <p className="text-base font-medium">
                    {selectedOrder.purchaseOrderCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Nhà Cung Cấp</p>
                  <p className="text-base font-medium">
                    {selectedOrder.supplier?.supplierName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày Đặt</p>
                  <p className="text-base font-medium">
                    {formatDate(selectedOrder.createDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    Ngày Cập Nhật Trạng Thái
                  </p>
                  <p className="text-base font-medium">
                    {formatDate(selectedOrder.updatedStatusDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tổng Tiền</p>
                  <p className="text-base font-medium text-green-600">
                    {selectedOrder.totalAmount.toLocaleString("vi-VN")} VND
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng Thái</p>
                  <p className="text-base font-medium">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        selectedOrder.status === 0
                          ? "bg-red-100 text-red-600"
                          : selectedOrder.status === 1
                          ? "bg-yellow-100 text-yellow-600"
                          : selectedOrder.status === 2
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {["Hủy", "Chờ nhập hàng", "Thiếu hàng", "Hoàn thành"][
                        selectedOrder.status
                      ] || "Không xác định"}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tạo Bởi</p>
                  <p className="text-base font-medium">
                    {selectedOrder.createdBy || "N/A"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Chi tiết đơn đặt hàng
              </h3>
              <Table
                columns={[
                  {
                    title: "Tên Sản Phẩm",
                    dataIndex: ["product", "productName"],
                    key: "productName",
                  },
                  {
                    title: "Số Lượng",
                    dataIndex: "quantity",
                    key: "quantity",
                    render: (quantity: number) => quantity.toLocaleString("vi-VN"),
                  },
                  {
                    title: "Giá Nhập (VND)",
                    dataIndex: "supplyPrice",
                    key: "supplyPrice",
                    render: (price: number) => price.toLocaleString("vi-VN"),
                  },
                  {
                    title: "Thành Tiền (VND)",
                    key: "total",
                    render: (_: any, record: PurchaseOrderDetail) =>
                      (record.quantity * record.supplyPrice).toLocaleString(
                        "vi-VN"
                      ),
                  },
                ]}
                dataSource={selectedOrder.products || []}
                rowKey="purchaseOrderDetailId"
                pagination={false}
                bordered
                className="rounded-lg"
              />
            </div>
          </div>
        )}
      </Modal>
      <Modal
        title={
          <div className="text-xl font-semibold text-gray-800">
            Tình trạng nhập hàng: {selectedOrder?.purchaseOrderCode}
          </div>
        }
        open={isStockStatusModalOpen}
        onCancel={() => setIsStockStatusModalOpen(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setIsStockStatusModalOpen(false)}
          >
            Đóng
          </Button>,
        ]}
        width={700}
        centered
        bodyStyle={{ padding: "24px", background: "#f9fafb" }}
      >
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-700 mb-4">
            Chi tiết tình trạng nhập hàng
          </h3>
          <Table
            columns={[
              {
                title: "Tên Sản Phẩm",
                dataIndex: "productName",
                key: "productName",
              },
              {
                title: "Số Lượng Đặt",
                dataIndex: "orderedQuantity",
                key: "orderedQuantity",
                render: (quantity: number) => quantity.toLocaleString("vi-VN"),
              },
              {
                title: "Số Lượng Đã Nhận",
                dataIndex: "receivedQuantity",
                key: "receivedQuantity",
                render: (quantity: number) => quantity.toLocaleString("vi-VN"),
              },
              {
                title: "Số Lượng Còn Thiếu",
                dataIndex: "shortageQuantity",
                key: "shortageQuantity",
                render: (quantity: number) => (
                  <span
                    className={
                      quantity > 0 ? "text-red-600" : "text-green-600"
                    }
                  >
                    {quantity.toLocaleString("vi-VN")}
                  </span>
                ),
              },
            ]}
            dataSource={stockStatus}
            rowKey="productId"
            pagination={false}
            bordered
            className="rounded-lg"
          />
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseOrderTable;