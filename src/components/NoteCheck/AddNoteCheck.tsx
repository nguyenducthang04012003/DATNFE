import React, { useState, useEffect } from "react";
import { Form, Input, Button, Select, Table, message } from "antd";
import Cookies from "js-cookie";
import { useAuth, apiClient } from "../../pages/Home/AuthContext";
import { useNavigate } from "react-router-dom";

interface StorageRoom {
  storageRoomId: number;
  storageRoomName: string;
}

interface ProductLot {
  id: number;
  lotId: number;
  productName: string;
  lotCode: string;
  quantity: number | null;
  storageRoomId: number;
}

interface NoteCheckDetailForm {
  productLotId: number;
  storageQuantity: number;
  actualQuantity: number;
  errorQuantity: number;
  differenceQuatity: number;
}

interface NoteCheck {
  noteCheckId: number;
  storageRoomId: number;
  status: boolean | null;
  noteCheckDetails: { productLotId: number }[];
}

interface AddNoteCheckProps {
  handleChangePage: (page: string) => void;
}

const AddNoteCheck: React.FC<AddNoteCheckProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [productLots, setProductLots] = useState<ProductLot[]>([]);
  const [pendingNoteCheckProductLotIds, setPendingNoteCheckProductLotIds] = useState<number[]>([]);
  const [details, setDetails] = useState<NoteCheckDetailForm[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiLoading, setApiLoading] = useState<boolean>(true);
  const [selectedStorageRoomId, setSelectedStorageRoomId] = useState<number | null>(null);
  const navigate = useNavigate();

  const USE_AUTH_TOKEN = false;

  useEffect(() => {
    fetchStorageRooms();
    fetchProductLots();
  }, []);

  const fetchStorageRooms = async () => {
    setApiLoading(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await apiClient.get("/StorageRoom/GetStorageRoomList", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStorageRooms(
        Array.isArray(response.data.data)
          ? response.data.data.map((room: any) => ({
              storageRoomId: room.storageRoomId,
              storageRoomName: room.storageRoomName,
            }))
          : []
      );
    } catch (error) {
      setStorageRooms([]);
    }
    setApiLoading(false);
  };

  const fetchProductLots = async () => {
    setApiLoading(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const response = await apiClient.get("/ProductLot", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const lots = Array.isArray(response.data.data)
        ? response.data.data.map((lot: any) => ({
            id: lot.id,
            lotId: lot.lotId,
            productName: lot.productName,
            lotCode: lot.lotCode,
            quantity: lot.quantity,
            storageRoomId: lot.storageRoomId,
          }))
        : [];
      setProductLots(lots);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách lô sản phẩm:", error);
      setProductLots([]);
    }
    setApiLoading(false);
  };

  const fetchPendingNoteChecks = async (storageRoomId: number) => {
    try {
      const response = await apiClient.get("/NoteCheck", {
        headers: { accept: "*/*" },
      });
      const pendingNotes = Array.isArray(response.data)
        ? response.data.filter(
            (note: NoteCheck) =>
              note.storageRoomId === storageRoomId && note.status === false
          )
        : [];
      const productLotIds = pendingNotes
        .flatMap((note: NoteCheck) => note.noteCheckDetails)
        .map((detail: { productLotId: number }) => detail.productLotId);
      setPendingNoteCheckProductLotIds([...new Set(productLotIds)]);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu kiểm kê chờ duyệt:", error);
      setPendingNoteCheckProductLotIds([]);
    }
  };

  const handleStorageRoomChange = (value: number) => {
    setSelectedStorageRoomId(value);
    form.resetFields(["productLotId", "storageQuantity", "actualQuantity", "errorQuantity"]);
    setDetails([]);
    fetchPendingNoteChecks(value);
  };

  const handleProductLotChange = (productLotId: number) => {
    const selectedLot = productLots.find((lot) => lot.id === productLotId);
    if (selectedLot) {
      form.setFieldsValue({
        storageQuantity: selectedLot.quantity ?? 0,
      });
    }
  };

  const handleAddDetail = (values: any) => {
    const storageQuantity = Number(values.storageQuantity);
    const actualQuantity = Number(values.actualQuantity);
    const errorQuantity = 0;
    const productLotId = Number(values.productLotId);
    const differenceQuatity = storageQuantity - actualQuantity;

    if (
      isNaN(storageQuantity) ||
      isNaN(actualQuantity) ||
      isNaN(productLotId) ||
      storageQuantity < 0 ||
      actualQuantity < 0
    ) {
      message.error("Vui lòng nhập số hợp lệ và không âm cho số lượng kho và thực tế.");
      return;
    }

    const selectedLot = productLots.find((lot) => lot.id === productLotId);
    if (!selectedLot || selectedLot.storageRoomId !== selectedStorageRoomId) {
      message.error("Lô sản phẩm không hợp lệ hoặc không thuộc kho đã chọn.");
      return;
    }

    if (pendingNoteCheckProductLotIds.includes(productLotId)) {
      message.error(
        "Lô sản phẩm này đã có trong một phiếu kiểm kê chờ duyệt. Vui lòng chọn lô khác."
      );
      return;
    }

    const newDetail: NoteCheckDetailForm = {
      productLotId,
      storageQuantity,
      actualQuantity,
      errorQuantity,
      differenceQuatity: differenceQuatity >= 0 ? differenceQuatity : 0,
    };
    setDetails([...details, newDetail]);
    form.resetFields(["productLotId", "storageQuantity", "actualQuantity", "errorQuantity"]);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: any) => {
    if (details.length === 0) {
      message.error("Vui lòng thêm ít nhất một sản phẩm để kiểm kê.");
      return;
    }

    if (!user?.customerId || isNaN(Number(user.customerId))) {
      message.error("Thông tin người dùng không hợp lệ. Vui lòng đăng nhập lại.");
      return;
    }

    // Double-check for pending note conflicts
    const conflictingLots = details.filter((detail) =>
      pendingNoteCheckProductLotIds.includes(detail.productLotId)
    );
    if (conflictingLots.length > 0) {
      message.error(
        "Một hoặc nhiều lô sản phẩm đã có trong phiếu kiểm kê chờ duyệt. Vui lòng kiểm tra lại."
      );
      return;
    }

    setLoading(true);
    try {
      const token = Cookies.get("token");
      const payload = {
        storageRoomId: Number(values.storageRoomId),
        reasonCheck: values.reasonCheck || "",
        createdBy: Number(user.customerId),
        noteCheckDetails: details.map((detail) => ({
          productLotId: Number(detail.productLotId),
          storageQuantity: Number(detail.storageQuantity),
          actualQuantity: Number(detail.actualQuantity),
          errorQuantity: 0,
          status: 0,
        })),
      };

      if (isNaN(payload.storageRoomId) || payload.storageRoomId <= 0) {
        throw new Error("storageRoomId không hợp lệ.");
      }
      if (isNaN(payload.createdBy) || payload.createdBy <= 0) {
        throw new Error("createdBy không hợp lệ.");
      }
      for (const detail of payload.noteCheckDetails) {
        if (
          isNaN(detail.productLotId) ||
          isNaN(detail.storageQuantity) ||
          isNaN(detail.actualQuantity) ||
          detail.storageQuantity < 0 ||
          detail.actualQuantity < 0
        ) {
          throw new Error(`Dữ liệu chi tiết không hợp lệ: ${JSON.stringify(detail)}`);
        }
        const lot = productLots.find((lot) => lot.id === detail.productLotId);
        if (!lot || lot.storageRoomId !== payload.storageRoomId) {
          throw new Error(`Lô sản phẩm không hợp lệ hoặc không thuộc kho: ${detail.productLotId}`);
        }
      }

      const headers = {
        accept: "*/*",
        "Content-Type": "application/json",
        ...(USE_AUTH_TOKEN && token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await apiClient.post("/NoteCheck/create", payload, { headers });

      message.success(response.data.message || "Tạo phiếu kiểm kê thành công");
      handleChangePage("Danh sách phiếu kiểm kê");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Không thể tạo phiếu kiểm kê. Vui lòng kiểm tra API.";
      message.error(errorMessage);
      console.error("Lỗi khi tạo phiếu kiểm kê:", error);
    }
    setLoading(false);
  };

  const filteredProductLots = selectedStorageRoomId
    ? productLots.filter((lot) => lot.storageRoomId === selectedStorageRoomId)
    : productLots;

  const detailColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "productLotId",
      key: "productName",
      render: (productLotId: number) => {
        const lot = productLots.find((lot) => lot.id === productLotId);
        return lot ? lot.productName : "Không xác định";
      },
    },
    {
      title: "Mã lô",
      dataIndex: "productLotId",
      key: "lotCode",
      render: (productLotId: number) => {
        const lot = productLots.find((lot) => lot.id === productLotId);
        return lot ? lot.lotCode : "Không xác định";
      },
    },
    {
      title: "Số lượng kho",
      dataIndex: "storageQuantity",
      key: "storageQuantity",
    },
    {
      title: "Số lượng thực tế",
      dataIndex: "actualQuantity",
      key: "actualQuantity",
    },
    {
      title: "Chênh lệch",
      dataIndex: "differenceQuatity",
      key: "differenceQuatity",
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: NoteCheckDetailForm) => (
        <Button danger onClick={() => handleRemoveDetail(details.indexOf(record))}>
          Xóa
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Tạo phiếu kiểm kê</h1>
      <Form form={form} layout="vertical" onFinish={handleAddDetail}>
        <Form.Item
          name="storageRoomId"
          label="Kho"
          rules={[{ required: true, message: "Vui lòng chọn kho" }]}
        >
          <Select
            placeholder="Chọn kho"
            loading={apiLoading}
            disabled={apiLoading}
            onChange={handleStorageRoomChange}
          >
            {storageRooms.map((room) => (
              <Select.Option key={room.storageRoomId} value={room.storageRoomId}>
                {room.storageRoomName}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="reasonCheck"
          label="Lý do kiểm kê"
          rules={[{ required: true, message: "Vui lòng nhập lý do kiểm kê" }]}
        >
          <Input placeholder="Nhập lý do kiểm kê" />
        </Form.Item>

        <h2 className="text-xl font-bold mt-6 mb-4">Thêm sản phẩm kiểm kê</h2>
        <div className="mb-4">
          <Form.Item
            name="productLotId"
            label="Lô sản phẩm"
            rules={[{ required: true, message: "Vui lòng chọn lô sản phẩm" }]}
            style={{ display: "inline-block", width: 350, marginRight: 16 }}
          >
            <Select
              placeholder="Chọn lô sản phẩm"
              loading={apiLoading}
              disabled={apiLoading || !selectedStorageRoomId || details.length > 0}
              onChange={handleProductLotChange}
              showSearch
              filterOption={(input, option) => {
                const lot = filteredProductLots.find((lot) => lot.id === option?.value);
                if (!lot) return false;
                const searchText = input.toLowerCase();
                return (
                  lot.productName.toLowerCase().includes(searchText) ||
                  lot.lotCode.toLowerCase().includes(searchText)
                );
              }}
            >
              {Array.isArray(filteredProductLots) &&
                filteredProductLots.map((lot) => (
                  <Select.Option key={lot.id} value={lot.id}>
                    {lot.productName} (Lô {lot.lotCode})
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="storageQuantity"
            label="Số lượng kho"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng kho" },
              {
                validator: async (_, value) => {
                  if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                    return Promise.reject(new Error("Số lượng kho phải là số không âm"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            style={{ display: "inline-block", width: 150, marginRight: 16 }}
          >
            <Input
              type="number"
              placeholder="Số lượng kho"
              min={0}
              disabled={details.length > 0}
            />
          </Form.Item>
          <Form.Item
            name="actualQuantity"
            label="Số lượng thực tế"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng thực tế" },
              {
                validator: async (_, value) => {
                  if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                    return Promise.reject(new Error("Số lượng thực tế phải là số không âm"));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            style={{ display: "inline-block", width: 150, marginRight: 16 }}
          >
            <Input
              type="number"
              placeholder="Số lượng thực tế"
              min={0}
              disabled={details.length > 0}
            />
          </Form.Item>
          <Form.Item style={{ display: "inline-block" }}>
            <Button
              type="primary"
              htmlType="submit"
              disabled={apiLoading || !selectedStorageRoomId || details.length > 0}
            >
              Thêm sản phẩm
            </Button>
          </Form.Item>
        </div>

        {details.length > 0 && (
          <Table
            columns={detailColumns}
            dataSource={details}
            rowKey="productLotId"
            pagination={false}
            className="mb-6"
          />
        )}

        <Form.Item>
          <Button
            type="primary"
            onClick={() => form.validateFields(['storageRoomId', 'reasonCheck']).then(handleSubmit)}
            loading={loading}
            disabled={details.length === 0}
          >
            Tạo phiếu kiểm kê
          </Button>
          <Button
            className="ml-4"
            onClick={() => handleChangePage("Danh sách phiếu kiểm kê")}
          >
            Hủy
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddNoteCheck;