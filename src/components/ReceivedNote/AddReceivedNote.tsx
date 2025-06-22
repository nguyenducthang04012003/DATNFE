import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Typography,
  Statistic,
  message,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";

const { Title } = Typography;

interface AddReceivedNoteProps {
  handleChangePage: (page: string) => void;
  handleAddNote: (newNote: ReceivedNote) => void;
  purchaseOrderId?: number;
  onRefreshPurchaseOrders?: () => void;
}

interface ReceivedNoteDetail {
  ReceiveNoteDetailId: number;
  ProductLotId: number;
  ProductName: string;
  LotCode: string;
  ActualReceived: number;
  SupplyPrice: number;
  OrderQuantity: number;
  Quantity: number;
  ShortageQuantity: number;
}

interface ReceivedNote {
  ReceiveNoteId: number;
  ReceiveNotesCode: string;
  PurchaseOrderId: number;
  Status: number | null;
  CreatedBy: number;
  CreatedDate: string;
  Details?: ReceivedNoteDetail[];
}

interface PurchaseOrder {
  purchaseOrderId: number;
  purchaseOrderCode: string;
  status: number;
}

interface Lot {
  lotId: number;
  lotCode: string;
}

interface ProductLot {
  id: number;
  lotId: number;
  productId: number;
  productName: string;
  lotCode: string;
  supplyPrice: number;
  orderQuantity: number;
  quantity: number;
  shortageQuantity: number;
}

const AddReceivedNote: React.FC<AddReceivedNoteProps> = ({
  handleChangePage,
  handleAddNote,
  purchaseOrderId,
  onRefreshPurchaseOrders,
}) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [details, setDetails] = useState<ReceivedNoteDetail[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [productLots, setProductLots] = useState<ProductLot[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const generateReceiveNotesCode = () => {
    const date = dayjs().format("DDMMYYYY");
    const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
    return `REC_${date}${sequence}`;
  };

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${API_BASE_URL}/PurchaseOrders/GetPurchaseOrdersList`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const filteredOrders = (response.data.data || []).filter(
          (po: PurchaseOrder) => po.status !== 3
        );
        setPurchaseOrders(filteredOrders);
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        message.error("Không thể tải danh sách đơn hàng!");
      }
    };
    fetchPurchaseOrders();
  }, []);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`${API_BASE_URL}/Lot`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLots(response.data.data || []);
      } catch (error) {
        console.error("Error fetching lots:", error);
        message.error("Không thể tải danh sách lô!");
      }
    };
    fetchLots();
  }, []);

  useEffect(() => {
    if (selectedLot) {
      const fetchProductLots = async () => {
        try {
          const token = localStorage.getItem("accessToken");
          const response = await axios.get(`${API_BASE_URL}/ProductLot`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const filteredProducts = response.data.data.filter(
            (p: ProductLot) => p.lotId === selectedLot
          );
          setProductLots(filteredProducts || []);
        } catch (error) {
          console.error("Error fetching product lots:", error);
          message.error("Không thể tải danh sách sản phẩm!");
        }
      };
      fetchProductLots();
    } else {
      setProductLots([]);
    }
  }, [selectedLot]);

  useEffect(() => {
    const isValidOrder = purchaseOrders.find(
      (po) => po.purchaseOrderId === purchaseOrderId && po.status !== 3
    );
    form.setFieldsValue({
      purchaseOrderId: isValidOrder ? purchaseOrderId : undefined,
      receiveNotesCode: generateReceiveNotesCode(),
      createdDate: dayjs(),
    });
  }, [purchaseOrderId, purchaseOrders, form]);

  const lotOptions = lots.map((lot) => ({
    value: lot.lotId,
    label: lot.lotCode,
  }));

  const productOptions = productLots.map((p) => ({
    value: p.id,
    label: p.productName,
  }));

  const totalAmount = details.reduce(
    (sum, item) => sum + item.ActualReceived * item.SupplyPrice,
    0
  );

  const handleSelectLot = (value: number) => {
    setSelectedLot(value);
    setSelectedProduct(null);
    setProductLots([]);
  };

  const handleSelectProduct = (value: number) => {
    setSelectedProduct(value);
    const product = productLots.find((p) => p.id === value);
    if (product && !details.some((d) => d.ProductLotId === product.id)) {
      setDetails([
        ...details,
        {
          ReceiveNoteDetailId: details.length + 1,
          ProductLotId: product.id,
          ProductName: product.productName,
          LotCode: product.lotCode,
          ActualReceived: 1,
          SupplyPrice: product.supplyPrice,
          OrderQuantity: product.orderQuantity,
          Quantity: product.quantity,
          ShortageQuantity: product.orderQuantity - product.quantity,
        },
      ]);
    }
  };

  const handleDetailChange = (
    index: number,
    field: keyof ReceivedNoteDetail,
    value: any
  ) => {
    const updatedDetails = [...details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    setDetails(updatedDetails);
  };

  const handleRemoveDetail = (index: number) => {
    const updatedDetails = details.filter((_, i) => i !== index);
    setDetails(updatedDetails);
  };

  const handleSave = async () => {
    try {
      if (!user) {
        message.error("Vui lòng đăng nhập để tạo phiếu nhập kho!");
        return;
      }

      const values = await form.validateFields();
      if (details.length === 0) {
        message.warning(
          "Vui lòng thêm ít nhất một sản phẩm vào chi tiết phiếu!"
        );
        return;
      }

      for (const detail of details) {
        if (detail.ActualReceived <= 0) {
          message.error(
            `Số lượng của sản phẩm "${detail.ProductName}" phải lớn hơn 0!`
          );
          return;
        }
      }

      const newNote: ReceivedNote = {
        ReceiveNoteId: Date.now(),
        ReceiveNotesCode: values.receiveNotesCode,
        PurchaseOrderId: Number(values.purchaseOrderId),
        Status: null,
        CreatedBy: user.customerId,
        CreatedDate: dayjs().toISOString(),
        Details: details,
      };

      const token = localStorage.getItem("accessToken");
      const payload = {
        purchaseOrderId: newNote.PurchaseOrderId,
        receivedNoteDetail: details.map((detail) => ({
          productLotId: detail.ProductLotId,
          actualReceived: detail.ActualReceived,
        })),
      };

      console.log("Payload gửi lên API:", JSON.stringify(payload, null, 2));

      // Kiểm tra purchaseOrderId và productLotId trước khi gửi
      const poExists = purchaseOrders.some(
        (po) => po.purchaseOrderId === newNote.PurchaseOrderId
      );
      if (!poExists) {
        message.error(`Đơn hàng ID ${newNote.PurchaseOrderId} không tồn tại!`);
        return;
      }

      for (const detail of details) {
        const productLotExists = productLots.some(
          (pl) => pl.id === detail.ProductLotId
        );
        if (!productLotExists) {
          message.error(`ProductLot ID ${detail.ProductLotId} không tồn tại!`);
          return;
        }
      }

      const response = await axios.post(
        `${API_BASE_URL}/ReceivedNote`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API response:", JSON.stringify(response.data, null, 2));

      handleAddNote(newNote);
      message.success(
        response.data.message || "Tạo phiếu nhập kho thành công!"
      );
      onRefreshPurchaseOrders?.();
      handleChangePage("Danh sách phiếu nhập");
    } catch (error: any) {
      console.error("Error creating received note:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Không thể tạo phiếu nhập kho! Vui lòng kiểm tra dữ liệu đầu vào.";
      console.error(
        "Detailed error:",
        JSON.stringify(error.response?.data, null, 2)
      );
      message.error(errorMessage);
    }
  };

  const columns = [
    { title: "Tên sản phẩm", dataIndex: "ProductName", key: "ProductName" },
    { title: "Số lô", dataIndex: "LotCode", key: "LotCode" },
    {
      title: "Số lượng nhập hàng",
      dataIndex: "ActualReceived",
      key: "ActualReceived",
      render: (_: any, record: any, index: number) => {
        const shortageQuantity = record.ShortageQuantity; 
        return (
          <InputNumber
            min={1}
            value={record.ActualReceived}
            onChange={(value) => {
              if (value > shortageQuantity) {
                message.error(
                  `Số lượng nhập không được vượt quá số lượng thiếu (${shortageQuantity})`
                );
                return;
              }
              handleDetailChange(index, "ActualReceived", value);
            }}
          />
        );
      },
    },
    {
      title: "Thiếu hụt (Đặt - Thực tế)",
      dataIndex: "ShortageQuantity",
      key: "ShortageQuantity",
    },
    {
      title: "Giá nhập",
      dataIndex: "SupplyPrice",
      key: "SupplyPrice",
      render: (price: number) => price.toLocaleString("vi-VN"),
    },
    {
      title: "Thành tiền",
      key: "TotalPrice",
      render: (_: any, record: any) =>
        `${(record.ActualReceived * record.SupplyPrice).toLocaleString(
          "vi-VN"
        )} VND`,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, __: any, index: number) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDetail(index)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <Title level={3}>Tạo phiếu nhập kho</Title>
      <Form layout="vertical" form={form}>
        <Form.Item
          label="Đơn hàng"
          name="purchaseOrderId"
          rules={[{ required: true, message: "Vui lòng chọn đơn hàng!" }]}
        >
          <Select
            placeholder="Chọn đơn hàng..."
            disabled={!!purchaseOrderId}
            showSearch
            filterOption={(input, option) => {
              const po = purchaseOrders.find(
                (po) => po.purchaseOrderId === option?.value
              );
              if (!po) return false;
              const searchText = input.toLowerCase();
              return (
                po.purchaseOrderCode.toLowerCase().includes(searchText) ||
                po.purchaseOrderId.toString().includes(searchText)
              );
            }}
            options={purchaseOrders.map((po) => ({
              value: po.purchaseOrderId,
              label: `${po.purchaseOrderId} (${po.purchaseOrderCode})`,
            }))}
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Ngày tạo"
          name="createdDate"
          rules={[{ required: true, message: "Ngày tạo không được để trống!" }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} disabled />
        </Form.Item>
      </Form>

      <Title level={5}>Chọn lô</Title>
      <Select
        placeholder="Chọn lô..."
        value={selectedLot}
        showSearch
        filterOption={(input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
        options={lotOptions}
        onChange={handleSelectLot}
        style={{ width: "100%", marginBottom: 8 }}
      />

      <Title level={5}>Chọn sản phẩm</Title>
      <Select
        placeholder={
          selectedLot ? "Chọn sản phẩm..." : "Vui lòng chọn lô trước"
        }
        value={selectedProduct}
        options={productOptions}
        onChange={handleSelectProduct}
        style={{ width: "100%", marginBottom: 16 }}
        disabled={!selectedLot}
      />

      <Table
        columns={columns}
        dataSource={details}
        rowKey="ReceiveNoteDetailId"
      />
      <Statistic title="Tổng tiền" value={totalAmount} suffix="VND" />

      <Button type="primary" onClick={handleSave} className="bg-blue-500">
        Lưu phiếu
      </Button>
      <Button
        style={{ marginLeft: 8 }}
        onClick={() => handleChangePage("Danh sách phiếu nhập")}
      >
        Hủy
      </Button>
    </div>
  );
};

export default AddReceivedNote;
