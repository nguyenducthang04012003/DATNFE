import React, { useState, useEffect } from "react";
import {
  Table,
  Input,
  Collapse,
  Button,
  Modal,
  DatePicker,
  Dropdown,
  Menu,
  notification,
  Select,
} from "antd";
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
import {
  EyeOutlined,
  FilterOutlined,
  PrinterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";

interface IssueNote {
  id: number;
  issueNoteCode: string;
  orderId: number;
  customerId: number;
  updatedStatusDate: Date;
  totalAmount: number;
  createdBy: number;
  createdDate: Date;
  status: number;
}

interface User {
  userId: number;
  userName: string;
  firstName: string;
  lastName: string;
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
  storageRoomName: string;
}

interface ProductLot {
  productLotId: number;
  productId: number;
  lotId: number;
  manufacturedDate: string;
  expiredDate: string;
  supplyPrice: number;
  quantity: number;
  status: boolean | null;
  product: Product;
}

interface IssueNoteDetail {
  issueNoteDetailId: number;
  issueNoteId: number;
  productLotId: number;
  quantity: number;
  productLot: ProductLot;
}

interface Customer {
  userId: number;
  firstName: string;
  lastName: string;
}

interface ProductLotAPI {
  id: number;
  storageRoomId: number;
  lotId: number;
}

interface StorageRoom {
  storageRoomId: number;
  storageRoomName: string;
}

interface Lot {
  lotId: number;
  lotCode: string;
}

interface IssueNoteTableProps {
  notes: IssueNote[];
  handleChangePage: (page: string, noteId?: number) => void;
  onUpdate: (updatedNote: IssueNote) => void;
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: IssueNote[]) => void;
  };
}

// Hàm chuyển đổi số thành chữ (tiếng Việt)
const numberToWords = (num: number): string => {
  if (num === 0) return "Không đồng";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const numbers = [
    "",
    "một",
    "hai",
    "ba",
    "bốn",
    "năm",
    "sáu",
    "bảy",
    "tám",
    "chín",
    "mười",
    "mười một",
    "mười hai",
    "mười ba",
    "mười bốn",
    "mười lăm",
    "mười sáu",
    "mười bảy",
    "mười tám",
    "mười chín",
  ];
  const tens = [
    "",
    "",
    "hai mươi",
    "ba mươi",
    "bốn mươi",
    "năm mươi",
    "sáu mươi",
    "bảy mươi",
    "tám mươi",
    "chín mươi",
  ];

  let result = "";
  let unitIndex = 0;

  while (num > 0) {
    let group = num % 1000;
    let groupStr = "";
    if (group > 0) {
      if (group >= 100) {
        groupStr += numbers[Math.floor(group / 100)] + " trăm ";
        group %= 100;
      }
      if (group >= 20) {
        groupStr += tens[Math.floor(group / 10)] + " ";
        group %= 10;
        if (group > 0) groupStr += numbers[group] + " ";
      } else if (group > 0) {
        groupStr += numbers[group] + " ";
      }
      groupStr = groupStr.trim();
      if (groupStr) {
        groupStr += " " + units[unitIndex];
      }
      result = groupStr + (result ? " " + result : "");
    }
    num = Math.floor(num / 1000);
    unitIndex++;
  }

  return (
    result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + " đồng"
  );
};

const IssueNoteTable: React.FC<IssueNoteTableProps> = ({
  notes,
  // handleChangePage,
  // onUpdate,
  rowSelection,
}) => {
  const {} = useAuth();
  const [filteredNotes, setFilteredNotes] = useState<IssueNote[]>(notes);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<IssueNote | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [issueNoteDetails, setIssueNoteDetails] = useState<IssueNoteDetail[]>(
    []
  );
  const [lotStorageMap, setLotStorageMap] = useState<{
    [productLotId: number]: string;
  }>({});
  const [lotCodeMap, setLotCodeMap] = useState<{
    [productLotId: number]: string;
  }>({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/User/GetUserList`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userList = response.data.data.map((user: any) => ({
        userId: user.userId,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách người dùng:", error);
    }
  };

  const fetchIssueNoteDetails = async (issueNoteId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_BASE_URL}/IssueNote/GetIssueNoteDetailByIssueNoteId/${issueNoteId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const details = response.data.data || [];
      setIssueNoteDetails(details);

      // Lấy thông tin lô và kho
      const { lotCodeMap, storageMap } = await fetchLotAndStorageInfo(details);
      setLotCodeMap(lotCodeMap);
      setLotStorageMap(storageMap);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết phiếu xuất kho:", error);
      setIssueNoteDetails([]);
      setLotCodeMap({});
      setLotStorageMap({});
    }
  };

  const fetchLotAndStorageInfo = async (
    details: IssueNoteDetail[]
  ): Promise<{
    lotCodeMap: { [productLotId: number]: string };
    storageMap: { [productLotId: number]: string };
  }> => {
    try {
      // Lấy danh sách ProductLot
      const lotResponse = await axios.get("${API_BASE_URL}/ProductLot");
      const productLots: ProductLotAPI[] = lotResponse.data.data || [];

      // Lấy danh sách Lot
      const lotApiResponse = await axios.get("${API_BASE_URL}/Lot");
      const lots: Lot[] = lotApiResponse.data.data || [];

      // Lấy danh sách StorageRoom
      const storageRoomResponse = await axios.get(
        "${API_BASE_URL}/StorageRoom/GetStorageRoomList"
      );
      const storageRooms: StorageRoom[] = storageRoomResponse.data.data || [];

      // Tạo ánh xạ từ lotId sang lotCode
      const lotCodeMap = lots.reduce(
        (acc: { [key: number]: string }, lot: Lot) => {
          acc[lot.lotId] = lot.lotCode;
          return acc;
        },
        {}
      );

      // Tạo ánh xạ từ storageRoomId sang storageRoomName
      const storageRoomMap = storageRooms.reduce(
        (acc: { [key: number]: string }, room: StorageRoom) => {
          acc[room.storageRoomId] = room.storageRoomName;
          return acc;
        },
        {}
      );

      // Tạo ánh xạ từ productLotId sang lotCode và storageRoomName
      const lotCodeResult: { [productLotId: number]: string } = {};
      const storageResult: { [productLotId: number]: string } = {};
      details.forEach((detail) => {
        const productLot = productLots.find(
          (lot) => lot.id === detail.productLotId
        );
        if (productLot) {
          lotCodeResult[detail.productLotId] =
            lotCodeMap[productLot.lotId] || "N/A";
          storageResult[detail.productLotId] =
            storageRoomMap[productLot.storageRoomId] || "N/A";
        } else {
          lotCodeResult[detail.productLotId] = "N/A";
          storageResult[detail.productLotId] = "N/A";
        }
      });

      return { lotCodeMap: lotCodeResult, storageMap: storageResult };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin lô và kho:", error);
      return { lotCodeMap: {}, storageMap: {} };
    }
  };

  const fetchCustomerName = async (customerId: number): Promise<string> => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("${API_BASE_URL}/User/GetCustomerList", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const customers: Customer[] = response.data.data;
      const customer = customers.find((c) => c.userId === customerId);
      if (customer) {
        return `${customer.firstName.trim()} ${customer.lastName.trim()}`.trim();
      }
      return "Không xác định";
    } catch (error) {
      console.error("Lỗi khi lấy thông tin khách hàng:", error);
      return "Không xác định";
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getUserNameById = (userId: number) => {
    const user = users.find((u) => u.userId === userId);
    return user ? `${user.firstName} ${user.lastName}` : `ID: ${userId}`;
  };

  const filterNotes = () => {
    let filteredData = [...notes];
    if (searchTerm.trim()) {
      filteredData = filteredData.filter((note) =>
        note.issueNoteCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filteredData = filteredData.filter(
        (note) => String(note.status) === statusFilter
      );
    }
    if (dateRange) {
      filteredData = filteredData.filter((note) => {
        const createdDate = new Date(note.createdDate);
        return (
          createdDate >= new Date(dateRange[0]) &&
          createdDate <= new Date(dateRange[1])
        );
      });
    }
    setFilteredNotes(filteredData);
  };

  useEffect(() => {
    filterNotes();
  }, [searchTerm, statusFilter, dateRange, notes]);

  const printIssueNote = async (issueNoteId: number) => {
    const note = filteredNotes.find((note) => note.id === issueNoteId);
    if (!note) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy phiếu để in.",
      });
      return;
    }

    let printContents = `
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; margin: 20px; }
        .ticket { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; }
        .header-top { display: flex; justify-content: space-between; align-items: top; margin-bottom: 10px; }
        .header-unit { text-align: left; }
        .header-form { text-align: right; font-size: 10pt; }
        .header-title { font-size: 14pt; font-weight: bold; margin: 10px 0; }
        .header-info { display: flex; justify-content: space-between; font-size: 12pt; }
        .ticket-details { margin-bottom: 20px; font-size: 12pt; }
        .ticket-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt; }
        .ticket-table th, .ticket-table td { border: 1px solid #000; padding: 6px; text-align: left; }
        .ticket-table th { font-weight: bold; text-align: center; }
        .ticket-table td.center { text-align: center; }
        .ticket-table td.right { text-align: right; }
        .ticket-total { margin-bottom: 20px; font-size: 12pt; }
        .ticket-signatures { display: flex; justify-content: space-between; margin-top: 40px; font-size: 12pt; }
        .signature-box { text-align: center; width: 22%; }
        .signature-box p { margin: 0; font-weight: normal; }
        .signature-box div { height: 50px; border-bottom: 1px solid #000; margin-bottom: 5px; }
      </style>
    `;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(
        `${API_BASE_URL}/IssueNote/GetIssueNoteDetailByIssueNoteId/${note.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const details: IssueNoteDetail[] = response.data.data || [];
      const customerName = await fetchCustomerName(note.customerId);

      // Lấy thông tin lô và kho cho in ấn
      const { storageMap } = await fetchLotAndStorageInfo(details);
      const storageRoomName = Object.values(storageMap)[0] || "N/A";

      const totalQuantity = details.reduce(
        (sum, detail) => sum + detail.quantity,
        0
      );
      const totalAmount = details.reduce(
        (sum, detail) =>
          sum + detail.quantity * detail.productLot.product.sellingPrice,
        0
      );

      const createdDate = new Date(note.createdDate);
      const formattedDate = `Ngày ${createdDate.getDate()} tháng ${
        createdDate.getMonth() + 1
      } năm ${createdDate.getFullYear()}`;

      printContents += `
        <div class="ticket">
          <div class="header">
            <div class="header-top">
              <div class="header-unit">
                <p><strong>Đơn vị:</strong> Công ty cổ phần dược phẩm Vinh Nguyên</p>
                <p><strong>Bộ phận:</strong> Kho vận</p>
              </div>
              <div class="header-form">
                <p><strong>Mẫu số 02 - VT</strong></p>
                <p>(Ban hành theo Thông tư số 200/2014/TT-BTC</p>
                <p>Ngày 22/12/2014 của Bộ Tài chính)</p>
              </div>
            </div>
            <div class="header-title">
              PHIẾU XUẤT KHO
            </div>
            <div class="header-info">
              <div>
                <p>${formattedDate}</p>
                <p><strong>Số:</strong> ${note.issueNoteCode}</p>
              </div>
              <div>
                <p><strong>Nợ:</strong> </p>
                <p><strong>Có:</strong> </p>
              </div>
            </div>
          </div>
          <div class="ticket-details">
            <p><strong>Họ và tên người xuất hàng:</strong> ${customerName}</p>
            <p><strong>Lý do xuất kho:</strong> Xuất kho theo đơn hàng</p>
            <p><strong>Xuất tại kho:</strong> ${storageRoomName}</p>
          </div>
          <table class="ticket-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hoá</th>
                <th>Mã số</th>
                <th>Đơn vị tính</th>
                <th>Số lượng<br>Yêu cầu</th>
                <th>Số lượng<br>Thực xuất</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${details
                .map(
                  (detail, index) => `
                    <tr>
                      <td class="center">${index + 1}</td>
                      <td>${detail.productLot.product.productName}</td>
                      <td>${detail.productLot.product.productCode}</td>
                      <td class="center">${detail.productLot.product.unit}</td>
                      <td class="right">${detail.quantity.toLocaleString()}</td>
                      <td class="right">${detail.quantity.toLocaleString()}</td>
                      <td class="right">${detail.productLot.product.sellingPrice.toLocaleString()}</td>
                      <td class="right">${(
                        detail.quantity * detail.productLot.product.sellingPrice
                      ).toLocaleString()}</td>
                    </tr>
                  `
                )
                .join("")}
              <tr>
                <td colspan="2"><strong>Cộng</strong></td>
                <td class="center">x</td>
                <td class="center">x</td>
                <td class="right"><strong>${totalQuantity.toLocaleString()}</strong></td>
                <td class="right"><strong>${totalQuantity.toLocaleString()}</strong></td>
                <td class="center">x</td>
                <td class="right"><strong>${totalAmount.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
          <div class="ticket-total">
            <p><strong>Tổng số tiền (viết bằng chữ):</strong> ${numberToWords(
              totalAmount
            )}</p>
            <p><strong>Số chứng từ gốc kèm theo: </strong></p>
          </div>
          <p style="text-align: right;">${formattedDate}</p>
          <div class="ticket-signatures">
            <div class="signature-box">
              <p>Người lập phiếu</p>
              <div></div>
              <p>(Ký, họ tên)</p>
            </div>
            <div class="signature-box">
              <p>Người nhận hàng</p>
              <div></div>
              <p>(Ký, họ tên)</p>
            </div>
            <div class="signature-box">
              <p>Thủ kho</p>
              <div></div>
              <p>(Ký, họ tên)</p>
            </div>
            <div class="signature-box">
              <p>Kế toán trưởng</p>
              <div></div>
              <p>(Ký, họ tên)</p>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết cho phiếu ${note.id}:`, error);
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi lấy chi tiết phiếu để in.",
      });
      return;
    }

    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow) {
      printWindow.document.write(
        "<html><head><title>In Phiếu Xuất Kho</title></head><body>"
      );
      printWindow.document.write(printContents);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  const columns = [
    { title: "Mã Phiếu", dataIndex: "issueNoteCode", key: "issueNoteCode" },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status: number) => {
        const statusText = ["Hủy", "Chờ xử lý", "Đã xuất"][status] || status;
        return (
          <span
            style={{
              color:
                status === 0
                  ? "#f5222d"
                  : status === 1
                  ? "#fa8c16"
                  : status === 2
                  ? "#52c41a"
                  : "#d9d9d9",
              fontWeight: "500",
            }}
          >
            {statusText}
          </span>
        );
      },
    },
    {
      title: "Người Tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (createdBy: number) => getUserNameById(createdBy),
    },
    {
      title: "Tổng Tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => `${amount.toLocaleString()} VND`,
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: Date) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "Không có dữ liệu",
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: IssueNote) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item
                key="view"
                icon={<EyeOutlined />}
                onClick={() => {
                  setSelectedNote(record);
                  fetchIssueNoteDetails(record.id);
                  setIsOpen(true);
                }}
              >
                Xem chi tiết
              </Menu.Item>
              <Menu.Item
                key="print"
                icon={<PrinterOutlined />}
                onClick={() => printIssueNote(record.id)}
              >
                In phiếu
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

  const detailColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: ["productLot", "product", "productName"],
      key: "productName",
    },
    {
      title: "Mã sản phẩm",
      dataIndex: ["productLot", "product", "productCode"],
      key: "productCode",
    },
    // {
    //   title: "Mã lô",
    //   key: "lotCode",
    //   render: (_: any, record: IssueNoteDetail) =>
    //     lotCodeMap[record.productLotId] || "N/A",
    // },
    {
      title: "Số lượng",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number) => quantity.toLocaleString(),
    },
    {
      title: "Giá bán",
      dataIndex: ["productLot", "product", "sellingPrice"],
      key: "sellingPrice",
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: "Phòng kho",
      dataIndex: ["productLot", "storageRoomName"],
      key: "storageRoomName",
      render: (text: string) => text || "Không có dữ liệu",
    },
    {
      title: "Tổng tiền",
      key: "total",
      render: (_: any, record: any) => {
        const quantity = record.quantity || 0;
        const price = record.productLot?.product?.sellingPrice || 0;
        const total = quantity * price;
        return `${total.toLocaleString()} VND`;
      },
    },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Tìm kiếm theo mã phiếu"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200 }}
        />
        <Button
          icon={<FilterOutlined />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Lọc
        </Button>
        {/* <Button type="primary" onClick={() => handleChangePage("Tạo phiếu xuất kho")}>
          + Tạo phiếu mới
        </Button> */}
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
              >
                <Select.Option value="">Chọn trạng thái</Select.Option>
                <Select.Option value="0">Hủy</Select.Option>
                <Select.Option value="1">Chờ xử lý</Select.Option>
                <Select.Option value="2">Đã xử lý</Select.Option>
                <Select.Option value="3">Đã xuất</Select.Option>
              </Select>
              <div className="col-span-3">
                <span style={{ marginRight: 8, marginBottom: 8 }}>
                  Lọc theo ngày tạo
                </span>
                <RangePicker
                  onChange={(_, dateStrings) =>
                    setDateRange(dateStrings as [string, string])
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
                    setFilteredNotes(notes);
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

      <div id="printableArea">
        <Table
          columns={columns}
          dataSource={filteredNotes}
          rowKey="id"
          rowSelection={rowSelection}
        />
      </div>

      <Modal
        title={
          <div
            style={{
              backgroundColor: "#f0f5ff",
              padding: "16px",
              borderRadius: "8px 8px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "18px",
              fontWeight: "600",
              color: "#1d39c4",
            }}
          >
            <EyeOutlined style={{ fontSize: "20px" }} />
            Chi tiết Phiếu: {selectedNote?.issueNoteCode}
          </div>
        }
        open={isOpen}
        onCancel={() => {
          setIsOpen(false);
          setIssueNoteDetails([]);
          setLotCodeMap({});
          setLotStorageMap({});
        }}
        footer={
          <div style={{ textAlign: "right", padding: "8px" }}>
            <Button
              type="primary"
              onClick={() => {
                setIsOpen(false);
                setIssueNoteDetails([]);
                setLotCodeMap({});
                setLotStorageMap({});
              }}
              style={{
                backgroundColor: "#1890ff",
                borderColor: "#1890ff",
                borderRadius: "4px",
                padding: "6px 16px",
              }}
            >
              Đóng
            </Button>
          </div>
        }
        width={1000}
        bodyStyle={{ padding: "24px", backgroundColor: "#fafafa" }}
      >
        {selectedNote && (
          <div>
            <div
              style={{
                backgroundColor: "#fff",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#595959",
                  marginBottom: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "8px",
                }}
              >
                Thông tin phiếu xuất kho
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>
                    Mã Phiếu:
                  </span>{" "}
                  <span style={{ color: "#262626" }}>
                    {selectedNote.issueNoteCode}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>
                    Trạng Thái:
                  </span>{" "}
                  <span
                    style={{
                      color:
                        selectedNote.status === 0
                          ? "#f5222d"
                          : selectedNote.status === 1
                          ? "#fa8c16"
                          : selectedNote.status === 2
                          ? "#52c41a"
                          : "#d9d9d9",
                      fontWeight: "500",
                    }}
                  >
                    {["Hủy", "Chờ xử lý", "Đã xử lý", "Đã xuất"][
                      selectedNote.status
                    ] || selectedNote.status}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>
                    Người Tạo:
                  </span>{" "}
                  <span style={{ color: "#262626" }}>
                    {getUserNameById(selectedNote.createdBy)}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>
                    Tổng Tiền:
                  </span>{" "}
                  <span style={{ color: "#262626", fontWeight: "600" }}>
                    {selectedNote.totalAmount.toLocaleString()} VND
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>
                    Ngày Tạo:
                  </span>{" "}
                  <span style={{ color: "#262626" }}>
                    {new Date(selectedNote.createdDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#fff",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#595959",
                  marginBottom: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  paddingBottom: "8px",
                }}
              >
                Chi tiết sản phẩm
              </h3>
              <Table
                columns={detailColumns}
                dataSource={issueNoteDetails}
                rowKey="issueNoteDetailId"
                pagination={false}
                bordered
                size="middle"
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
                style={{ borderRadius: "8px", overflow: "hidden" }}
                locale={{ emptyText: "Không có sản phẩm nào trong phiếu này." }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IssueNoteTable;
