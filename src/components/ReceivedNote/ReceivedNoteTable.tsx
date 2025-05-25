import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Input, Collapse, DatePicker, Dropdown, notification } from "antd";
const { RangePicker } = DatePicker;
const { Panel } = Collapse;
import {
  EyeOutlined,
  FilterOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import axios from "axios";

interface ReceivedNote {
  receiveNoteId: number;
  receiveNotesCode: string;
  purchaseOrderId: number;
  status: string | null;
  createdBy: number;
  createdDate: string;
  createdByNavigation?: {
    userId: number;
    userName: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    age: number;
    avatar: string | null;
    address: string;
    roleId: number;
    employeeCode: string | null;
    taxCode: string | null;
    status: boolean;
    createdBy: number;
    createdDate: string | null;
    roleName: string | null;
  };
  purchaseOrder?: {
    purchaseOrderId: number;
    purchaseOrderCode: string;
    supplierId: number;
    updatedStatusDate: string;
    totalAmount: number;
    status: number;
    createdBy: number | null;
    createDate: string;
    amountPaid: number | null;
    createdByNavigation: any | null;
    supplier: {
      supplierId: number;
      supplierName: string;
      supplierCode: string;
      [key: string]: any;
    } | null;
  };
}

interface ReceivedNoteDetail {
  receiveNoteDetailId: number;
  noteNumber: number | null;
  productLotId: number;
  productName: string;
  productCode: string;
  lotCode: string;
  unit: string;
  actualReceived: number;
  unitPrice: number;
  totalAmount: number;
  documentNumber: string | null;
  createdBy: string | null;
  createdDate: string | null;
}

interface ProductLot {
  id: number;
  storageRoomId: number;
}

interface StorageRoom {
  storageRoomId: number;
  storageRoomName: string;
}

interface ReceivedNoteTableProps {
  notes: ReceivedNote[];
  handleChangePage: (page: string, noteId?: number) => void;
  onUpdate: (updatedNote: ReceivedNote) => void;
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (selectedRowKeys: React.Key[], selectedRows: ReceivedNote[]) => void;
  };
}

// Hàm chuyển đổi số thành chữ (tiếng Việt)
const numberToWords = (num: number): string => {
  if (num === 0) return "Không đồng";

  const units = ["", "nghìn", "triệu", "tỷ"];
  const numbers = [
    "", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín",
    "mười", "mười một", "mười hai", "mười ba", "mười bốn", "mười lăm",
    "mười sáu", "mười bảy", "mười tám", "mười chín"
  ];
  const tens = ["", "", "hai mươi", "ba mươi", "bốn mươi", "năm mươi", "sáu mươi", "bảy mươi", "tám mươi", "chín mươi"];

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

  return result.trim().charAt(0).toUpperCase() + result.trim().slice(1) + " đồng";
};

const ReceivedNoteTable: React.FC<ReceivedNoteTableProps> = ({
  notes,
  // handleChangePage,
  // onUpdate,
  rowSelection,
}) => {
  const [filteredNotes, setFilteredNotes] = useState<ReceivedNote[]>(notes);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ReceivedNote | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [receivedNoteDetails, setReceivedNoteDetails] = useState<ReceivedNoteDetail[]>([]);
  const [noteTotalAmount, setNoteTotalAmount] = useState<number>(0);
  const [noteTotals, setNoteTotals] = useState<{ [key: number]: number }>({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const openNoteDetails = async (receiveNoteId: number) => {
    const note = filteredNotes.find((n) => n.receiveNoteId === receiveNoteId);
    if (note) {
      setSelectedNote(note);
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/ReceivedNote/${receiveNoteId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const { data } = response.data;
        setReceivedNoteDetails(data.receivedNoteDetails || []);
        const total = (data.receivedNoteDetails || []).reduce(
          (sum: number, detail: ReceivedNoteDetail) => sum + detail.totalAmount,
          0
        );
        setNoteTotalAmount(total);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết phiếu:", error);
        setReceivedNoteDetails([]);
        setNoteTotalAmount(0);
      }
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const fetchAllTotals = async () => {
      const totals: { [key: number]: number } = {};
      for (const note of notes) {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(`${API_BASE_URL}/ReceivedNote/${note.receiveNoteId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const { data } = response.data;
          const total = (data.receivedNoteDetails || []).reduce(
            (sum: number, detail: ReceivedNoteDetail) => sum + detail.totalAmount,
            0
          );
          totals[note.receiveNoteId] = total;
        } catch (error) {
          console.error(`Lỗi khi lấy chi tiết cho phiếu ${note.receiveNoteId}:`, error);
          totals[note.receiveNoteId] = 0;
        }
      }
      setNoteTotals(totals);
    };
    fetchAllTotals();
  }, [notes]);

  const filterNotes = () => {
    let filteredData = [...notes];
    if (searchTerm.trim()) {
      filteredData = filteredData.filter((note) =>
        note.receiveNotesCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filteredData = filteredData.filter((note) => note.status === statusFilter);
    }
    if (dateRange) {
      filteredData = filteredData.filter((note) => {
        const createdDate = new Date(note.createdDate);
        return createdDate >= new Date(dateRange[0]) && createdDate <= new Date(dateRange[1]);
      });
    }
    filteredData.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    setFilteredNotes(filteredData);
  };

  useEffect(() => {
    filterNotes();
  }, [searchTerm, statusFilter, dateRange, notes]);

  const getUserNameById = (note: ReceivedNote) => {
    if (note.createdByNavigation) {
      const firstName = note.createdByNavigation.firstName || "";
      const lastName = note.createdByNavigation.lastName || "";
      return `${firstName.trim()} ${lastName}`.trim();
    }
    return `ID: ${note.createdBy}`;
  };

  const fetchStorageRoomForLots = async (details: ReceivedNoteDetail[]): Promise<string> => {
    try {
      // Fetch ProductLot data
      const lotResponse = await axios.get(`${API_BASE_URL}/ProductLot`);
      const productLots: ProductLot[] = lotResponse.data.data || [];

      // Fetch StorageRoom data
      const storageRoomResponse = await axios.get(`${API_BASE_URL}/StorageRoom/GetStorageRoomList`);
      const storageRooms: StorageRoom[] = storageRoomResponse.data.data || [];

      // Map storageRoomId to storageRoomName
      const storageRoomMap = storageRooms.reduce((acc: { [key: number]: string }, room: StorageRoom) => {
        acc[room.storageRoomId] = room.storageRoomName;
        return acc;
      }, {});

      // Get unique storage room names for the lots
      const storageRoomIds = details
        .map((detail) => productLots.find((lot) => lot.id === detail.productLotId)?.storageRoomId)
        .filter((id): id is number => id !== undefined);

      const uniqueStorageRoomNames = [...new Set(
        storageRoomIds.map((id) => storageRoomMap[id] || "N/A")
      )];

      // Return the first storage room name or a comma-separated list
      return uniqueStorageRoomNames.length > 0
        ? uniqueStorageRoomNames[0] // Use first storage room for simplicity
        : "N/A";
    } catch (error) {
      console.error("Lỗi khi lấy thông tin kho:", error);
      return "N/A";
    }
  };

  const printTable = async (receiveNoteId: number) => {
    const note = filteredNotes.find((note) => note.receiveNoteId === receiveNoteId);
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

    const token = localStorage.getItem("accessToken");

    try {
      const response = await axios.get(`${API_BASE_URL}/ReceivedNote/${note.receiveNoteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { data } = response.data;
      const details = data.receivedNoteDetails || [];
      const totalAmount = details.reduce(
        (sum: number, detail: ReceivedNoteDetail) => sum + detail.totalAmount,
        0
      );
      const totalQuantity = details.reduce(
        (sum: number, detail: ReceivedNoteDetail) => sum + detail.actualReceived,
        0
      );

      const createdDate = new Date(note.createdDate);
      const formattedDate = `Ngày ${createdDate.getDate()} tháng ${createdDate.getMonth() + 1} năm ${createdDate.getFullYear()}`;
      // const supplierName = note.purchaseOrder?.supplier?.supplierName || "Không xác định";
      const purchaseOrderCode = note.purchaseOrder?.purchaseOrderCode || "N/A";
      const purchaseOrderDate = note.purchaseOrder?.createDate
        ? new Date(note.purchaseOrder.createDate).toLocaleDateString("vi-VN")
        : "N/A";
      const documentNumber = details[0]?.documentNumber || "Không có";
      const storageRoomName = await fetchStorageRoomForLots(details);

      printContents += `
        <div class="ticket">
          <div class="header">
            <div class="header-top">
              <div class="header-unit">
                <p><strong>Đơn vị:</strong> Công ty cổ phần dược phẩm Vinh Nguyên</p>
                <p><strong>Bộ phận:</strong> Kho vận</p>
              </div>
              <div class="header-form">
                <p><strong>Mẫu số 01 - VT</strong></p>
                <p>(Ban hành theo Thông tư số 200/2014/TT-BTC</p>
                <p>Ngày 22/12/2014 của Bộ Tài chính)</p>
              </div>
            </div>
            <div class="header-title">
              PHIẾU NHẬP KHO
            </div>
            <div class="header-info">
              <div>
                <p>${formattedDate}</p>
                <p><strong>Số:</strong> ${note.receiveNotesCode}</p>
              </div>
              <div>
               
              </div>
            </div>
          </div>
          <div class="ticket-details">
            <p><strong>Họ và tên người giao:</strong> </p>
            <p><strong>Theo:</strong> Đơn mua hàng số ${purchaseOrderCode} ngày ${purchaseOrderDate} của Công ty cổ phần dược phẩm Vinh Nguyên</p>
            <p><strong>Nhập tại kho:</strong> ${storageRoomName}</p>
          </div>
          <table class="ticket-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hoá</th>
                <th>Mã số</th>
                <th>Đơn vị tính</th>
                <th>Số lượng<br>Theo chứng từ</th>
                <th>Số lượng<br>Thực nhập</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${details
                .map(
                  (detail: ReceivedNoteDetail, index: number) => `
                    <tr>
                      <td class="center">${index + 1}</td>
                      <td>${detail.productName} (Lô: ${detail.lotCode})</td>
                      <td>${detail.productCode}</td>
                      <td class="center">${detail.unit}</td>
                      <td class="right">${detail.actualReceived.toLocaleString()}</td>
                      <td class="right">${detail.actualReceived.toLocaleString()}</td>
                      <td class="right">${detail.unitPrice.toLocaleString()}</td>
                      <td class="right">${detail.totalAmount.toLocaleString()}</td>
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
            <p><strong>Tổng số tiền (viết bằng chữ):</strong> ${numberToWords(totalAmount)}</p>
            <p><strong>Số chứng từ gốc kèm theo:</strong> ${documentNumber}</p>
          </div>
          <p style="text-align: right;">${formattedDate}</p>
          <div class="ticket-signatures">
            <div class="signature-box">
              <p>Người lập phiếu</p>
              <div></div>
              <p>(Ký, họ tên)</p>
            </div>
            <div class="signature-box">
              <p>Người giao hàng</p>
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
      console.error(`Lỗi khi lấy chi tiết cho phiếu ${note.receiveNoteId}:`, error);
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi lấy chi tiết phiếu để in.",
      });
      return;
    }

    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow) {
      printWindow.document.write("<html><head><title>In Phiếu Nhập Kho</title></head><body>");
      printWindow.document.write(printContents);
      printWindow.document.write("</body></html>");
      printWindow.document.close();
      printWindow.print();
    }
  };

  const exportToExcelSingleNote = async (receiveNoteId: number) => {
    const note = filteredNotes.find((note) => note.receiveNoteId === receiveNoteId);
    if (!note) {
      notification.error({
        message: "Lỗi",
        description: "Không tìm thấy phiếu để xuất Excel.",
      });
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/ReceivedNote/${note.receiveNoteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const { data } = response.data;
      const details = data.receivedNoteDetails || [];
      const totalAmount = details.reduce(
        (sum: number, detail: ReceivedNoteDetail) => sum + detail.totalAmount,
        0
      );
      const totalQuantity = details.reduce(
        (sum: number, detail: ReceivedNoteDetail) => sum + detail.actualReceived,
        0
      );
      const storageRoomName = await fetchStorageRoomForLots(details);

      // Tạo dữ liệu cho Excel
      const excelData = [
        ["Đơn vị: Công ty cổ phần dược phẩm Vinh Nguyên"],
        ["Bộ phận: Kho vận"],
        ["Mẫu số 01 - VT"],
        ["(Ban hành theo Thông tư số 200/2014/TT-BTC Ngày 22/12/2014 của Bộ Tài chính)"],
        [],
        ["PHIẾU NHẬP KHO"],
        [`Ngày ${new Date(note.createdDate).getDate()} tháng ${new Date(note.createdDate).getMonth() + 1} năm ${new Date(note.createdDate).getFullYear()}`],
        [`Số: ${note.receiveNotesCode}`],
        ["Nợ: 156", "", "Có: 331"],
        [],
        [`Họ và tên người giao: ${note.purchaseOrder?.supplier?.supplierName || "Không xác định"}`],
        [`Theo: Đơn mua hàng số ${note.purchaseOrder?.purchaseOrderCode || "N/A"} ngày ${note.purchaseOrder?.createDate ? new Date(note.purchaseOrder.createDate).toLocaleDateString("vi-VN") : "N/A"} của Công ty cổ phần dược phẩm Vinh Nguyên`],
        [`Nhập tại kho: ${storageRoomName}`],
        [],
        ["STT", "Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hoá", "Mã số", "Đơn vị tính", "Số lượng Theo chứng từ", "Số lượng Thực nhập", "Đơn giá", "Thành tiền"],
        ...details.map((detail: ReceivedNoteDetail, index: number) => [
          index + 1,
          `${detail.productName} (Lô: ${detail.lotCode})`,
          detail.productCode,
          detail.unit,
          detail.actualReceived,
          detail.actualReceived,
          detail.unitPrice,
          detail.totalAmount,
        ]),
        ["", "Cộng", "x", "x", totalQuantity, totalQuantity, "x", totalAmount],
        [],
        [`Tổng số tiền (viết bằng chữ): ${numberToWords(totalAmount)}`],
        [`Số chứng từ gốc kèm theo: ${details[0]?.documentNumber || "Không có"}`],
        [],
        [`Ngày ${new Date(note.createdDate).getDate()} tháng ${new Date(note.createdDate).getMonth() + 1} năm ${new Date(note.createdDate).getFullYear()}`],
        [],
        ["Người lập phiếu", "", "Người giao hàng", "", "Thủ kho", "", "Kế toán trưởng"],
        ["(Ký, họ tên)", "", "(Ký, họ tên)", "", "(Ký, họ tên)", "", "(Ký, họ tên)"],
      ];

      // Tạo worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);

      // Định dạng cột
      worksheet["!cols"] = [
        { wch: 5 },  // STT
        { wch: 40 }, // Tên, nhãn hiệu, ...
        { wch: 15 }, // Mã số
        { wch: 10 }, // Đơn vị tính
        { wch: 15 }, // Số lượng Theo chứng từ
        { wch: 15 }, // Số lượng Thực nhập
        { wch: 15 }, // Đơn giá
        { wch: 15 }, // Thành tiền
      ];

      // Gộp ô cho tiêu đề và các trường
      worksheet["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Đơn vị
        { s: { r: 1, c: 0 }, e: { r: 1, c: 7 } }, // Bộ phận
        { s: { r: 2, c: 0 }, e: { r: 2, c: 7 } }, // Mẫu số
        { s: { r: 3, c: 0 }, e: { r: 3, c: 7 } }, // Thông tư
        { s: { r: 5, c: 0 }, e: { r: 5, c: 7 } }, // PHIẾU NHẬP KHO
        { s: { r: 6, c: 0 }, e: { r: 6, c: 7 } }, // Ngày
        { s: { r: 7, c: 0 }, e: { r: 7, c: 7 } }, // Số
        { s: { r: 10, c: 0 }, e: { r: 10, c: 7 } }, // Người giao
        { s: { r: 11, c: 0 }, e: { r: 11, c: 7 } }, // Theo
        { s: { r: 12, c: 0 }, e: { r: 12, c: 7 } }, // Nhập tại kho
        { s: { r: details.length + 15, c: 0 }, e: { r: details.length + 15, c: 7 } }, // Tổng số tiền
        { s: { r: details.length + 16, c: 0 }, e: { r: details.length + 16, c: 7 } }, // Số chứng từ
        { s: { r: details.length + 18, c: 0 }, e: { r: details.length + 18, c: 7 } }, // Ngày
      ];

      // Tạo workbook và lưu file
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, `PhieuNhap_${note.receiveNotesCode}`);
      XLSX.writeFile(workbook, `PhieuNhap_${note.receiveNotesCode}.xlsx`);
    } catch (error) {
      console.error(`Lỗi khi lấy chi tiết cho phiếu ${note.receiveNoteId}:`, error);
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi xuất Excel chi tiết phiếu.",
      });
    }
  };

  const columns = [
    { title: "Mã Phiếu", dataIndex: "receiveNotesCode", key: "receiveNotesCode" },
    {
      title: "Người Tạo",
      dataIndex: "createdBy",
      key: "createdBy",
      render: (_: any, record: ReceivedNote) => getUserNameById(record),
    },
    {
      title: "Tổng giá trị phiếu (VND)",
      key: "totalAmount",
      render: (_: any, record: ReceivedNote) =>
        `${(noteTotals[record.receiveNoteId] || 0).toLocaleString()}`,
    },
    {
      title: "Ngày Tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "",
      key: "actions",
      render: (_: any, record: ReceivedNote) => {
        const menuItems = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "Xem chi tiết",
            onClick: () => openNoteDetails(record.receiveNoteId),
          },
          {
            key: "print",
            icon: <PrinterOutlined />,
            label: "In phiếu",
            onClick: () => printTable(record.receiveNoteId),
          },
          {
            key: "export",
            icon: <FileExcelOutlined />,
            label: "Xuất Excel",
            onClick: () => exportToExcelSingleNote(record.receiveNoteId),
          },
        ];

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
          >
            <Button shape="circle" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ];

  const detailColumns = [
    { title: "Tên Sản Phẩm", dataIndex: "productName", key: "productName" },
    { title: "Mã Sản Phẩm", dataIndex: "productCode", key: "productCode" },
    {
      title: "Số Lượng",
      dataIndex: "actualReceived",
      key: "actualReceived",
      render: (quantity: number) => quantity.toLocaleString(),
    },
    { title: "Số Lô", dataIndex: "lotCode", key: "lotCode" },
    { title: "Đơn Vị", dataIndex: "unit", key: "unit" },
    {
      title: "Đơn giá (VND)",
      dataIndex: "unitPrice",
      key: "unitPrice",
      align: "right" as const,
      render: (price: number) => `${price.toLocaleString()}`,
    },
    {
      title: "Thành Tiền (VND)",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right" as const,
      render: (total: number) => `${total.toLocaleString()}`,
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
        <Button icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
          Lọc
        </Button>
        {/* <Button type="primary" onClick={() => handleChangePage("Tạo phiếu nhập kho")}>
          + Tạo phiếu mới
        </Button> */}
      </div>

      {showFilters && (
        <Collapse defaultActiveKey={["1"]}>
          <Panel header="Bộ lọc nâng cao" key="1">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              <div className="col-span-3">
                <span style={{ marginRight: 8, marginBottom: 8 }}>Lọc theo ngày tạo</span>
                <RangePicker
                  onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])}
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
          rowKey="receiveNoteId"
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
            Chi tiết Phiếu: {selectedNote?.receiveNotesCode}
          </div>
        }
        open={isOpen}
        onCancel={() => {
          setIsOpen(false);
          setReceivedNoteDetails([]);
          setNoteTotalAmount(0);
        }}
        footer={
          <div style={{ textAlign: "right", padding: "8px" }}>
            <Button
              type="primary"
              onClick={() => {
                setIsOpen(false);
                setReceivedNoteDetails([]);
                setNoteTotalAmount(0);
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
                Thông tin phiếu nhập kho
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "12px",
                }}
              >
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>Mã Phiếu:</span>{" "}
                  <span style={{ color: "#262626" }}>{selectedNote.receiveNotesCode}</span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>Người Tạo:</span>{" "}
                  <span style={{ color: "#262626" }}>{getUserNameById(selectedNote)}</span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>Tổng giá trị phiếu:</span>{" "}
                  <span style={{ color: "#262626", fontWeight: "600" }}>
                    {noteTotalAmount.toLocaleString()} VND
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>Ngày Tạo:</span>{" "}
                  <span style={{ color: "#262626" }}>
                    {new Date(selectedNote.createdDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div>
                  <span style={{ fontWeight: "500", color: "#8c8c8c" }}>Mã Đơn Mua Hàng:</span>{" "}
                  <span style={{ color: "#262626" }}>
                    {selectedNote.purchaseOrder?.purchaseOrderCode || "N/A"}
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
                dataSource={receivedNoteDetails}
                rowKey="receiveNoteDetailId"
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

export default ReceivedNoteTable;