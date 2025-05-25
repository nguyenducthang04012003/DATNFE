import React, { useState, useEffect } from "react";
import { Button, Input, Select, Table, message, Space, Form } from "antd";
import axios from "axios";
import { useAuth } from "../../pages/Home/AuthContext";

interface AddLotProps {
  handleChangePage: (page: string) => void;
}

interface Product {
  productId: number;
  productName: string;
}

interface StorageRoom {
  storageRoomId: number;
  storageRoomName: string;
  status: boolean;
}

interface SelectedProduct {
  id: string;
  name: string;
  quantity: number;
  supplyPrice: string;
  manufacturedDate: string;
  expiredDate: string;
  storageRoomId: number | null;
  OrderQuantity: number;
}

// Utility function to remove Vietnamese diacritics
const removeVietnameseDiacritics = (str: string): string => {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const AddLot: React.FC<AddLotProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [lotCode, setLotCode] = useState<string>("");
  const [products, setProducts] = useState<Product[]>([]);
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [error, setError] = useState<string>("");
  const [isLotCreated, setIsLotCreated] = useState<boolean>(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${API_BASE_URL}/Product/ListProduct`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProducts(response.data.data || []);
      } catch (error) {
        // console.error("Lỗi khi lấy danh sách sản phẩm:", error);
        // message.error("Không thể tải danh sách sản phẩm.");
      }
    };
    fetchProducts();
  }, []);

  // Fetch storage rooms
  useEffect(() => {
    const fetchStorageRooms = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(
          `${API_BASE_URL}/StorageRoom/GetStorageRoomList`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setStorageRooms(
          response.data.data.filter((room: StorageRoom) => room.status) || []
        );
      } catch (error) {
        // console.error("Lỗi khi lấy danh sách phòng kho:", error);
        // message.error("Không thể tải danh sách phòng kho.");
      }
    };
    fetchStorageRooms();
  }, []);

  const productOptions = products.map((p) => ({
    value: String(p.productId),
    label: p.productName,
  }));

  const storageRoomOptions = storageRooms.map((room) => ({
    value: room.storageRoomId,
    label: room.storageRoomName,
  }));

  const handleSelectProduct = (value: string) => {
    const product = products.find((p) => String(p.productId) === value);
    if (
      product &&
      !selectedProducts.some((p) => p.id === String(product.productId))
    ) {
      setSelectedProducts([
        ...selectedProducts,
        {
          id: String(product.productId),
          name: product.productName,
          quantity: 0,
          supplyPrice: "",
          manufacturedDate: "",
          expiredDate: "",
          storageRoomId: null,
          OrderQuantity: 0,
        },
      ]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const handleCreateLot = async () => {
    if (!user) {
      setError("Vui lòng đăng nhập để tạo lô.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/Lot`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const lots = response.data.data || [];
      let maxLotNumber = 0;

      lots.forEach((lot: { lotCode: string }) => {
        const match = lot.lotCode.match(/^LOT(\d+)$/);
        if (match) {
          const lotNumber = parseInt(match[1], 10);
          if (lotNumber > maxLotNumber) {
            maxLotNumber = lotNumber;
          }
        }
      });

      const newLotCode = `LOT${maxLotNumber + 1}`;
      setLotCode(newLotCode);
      setIsLotCreated(true);
      message.success(
        `Mã lô tạm thời: ${newLotCode}. Vui lòng tạo sản phẩm để tạo lô.`
      );
    } catch (error) {
      // console.error("Lỗi khi lấy danh sách lô:", error);
      // message.error("Không thể tạo mã lô mới.");
    }
  };

  const handleSave = async () => {
    if (!user) {
      setError("Vui lòng đăng nhập để lưu lô.");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Normalize to midnight for comparison

    for (const product of selectedProducts) {
      // Check for required fields
      if (
        !product.supplyPrice.trim() ||
        !product.manufacturedDate ||
        !product.expiredDate ||
        !product.storageRoomId ||
        product.OrderQuantity <= 0
      ) {
        setError(
          "Vui lòng nhập đầy đủ thông tin cho tất cả sản phẩm (giá nhập, ngày sản xuất, ngày hết hạn, kho, số lượng đặt hàng)."
        );
        return;
      }

      // Parse dates for validation
      const manufacturedDate = new Date(product.manufacturedDate);
      const expiredDate = new Date(product.expiredDate);

      // Validate dates
      if (isNaN(manufacturedDate.getTime()) || isNaN(expiredDate.getTime())) {
        setError("Ngày sản xuất hoặc ngày hết hạn không hợp lệ.");
        return;
      }

      // Manufacturing date should not be in the future
      if (manufacturedDate > currentDate) {
        setError("Ngày sản xuất không được sau ngày hiện tại.");
        return;
      }

      // Expiration date should not be earlier than manufacturing date
      if (expiredDate <= manufacturedDate) {
        setError("Ngày hết hạn phải sau ngày sản xuất.");
        return;
      }
    }

    setError("");

    try {
      const token = localStorage.getItem("accessToken");

      // Step 1: Create the lot
      const lotPayload = {
        lotCode: lotCode,
        createdBy: user.customerId,
      };

      const createResponse = await axios.post(
        `${API_BASE_URL}/Lot`,
        lotPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const lotCodeFromResponse = createResponse.data.data.lotCode || lotCode;

      // Get lotId
      const getLotResponse = await axios.get(
        `${API_BASE_URL}/Lot/${lotCodeFromResponse}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const rawLotId = getLotResponse.data.data?.lotId;
      const lotId = Number(rawLotId);

      if (isNaN(lotId) || lotId <= 0) {
        throw new Error("Không thể lấy lotId hợp lệ từ API Get Lot.");
      }

      // Step 2: Save products to the lot
      const payload = selectedProducts.map((product) => ({
        lotId: lotId,
        productId: Number(product.id),
        quantity: product.quantity,
        manufacturedDate: new Date(product.manufacturedDate).toISOString(),
        expiredDate: new Date(product.expiredDate).toISOString(),
        supplyPrice: Number(product.supplyPrice),
        orderQuantity: product.OrderQuantity,
        status: 1,
        storageRoomId: product.storageRoomId,
      }));

      const response = await axios.post(
        `${API_BASE_URL}/ProductLot`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      message.success(
        response.data.message || "Lô và sản phẩm đã được tạo thành công!"
      );
      handleChangePage("Danh sách lô hàng");
    } catch (error: any) {
      console.error("Lỗi khi lưu lô và sản phẩm:", error);
      // const errorMessage =
      //   error.response?.data?.message ||
      //   error.response?.data?.errors?.[0] ||
      //   "Không thể tạo lô hoặc thêm sản phẩm.";
      // message.error(errorMessage);
      // setError(errorMessage);
    }
  };

  const columns = [
    // { title: "Mã SP", dataIndex: "id", key: "id" },
    { title: "Tên SP", dataIndex: "name", key: "name" },
    {
      title: "Số lượng đặt hàng",
      dataIndex: "OrderQuantity",
      key: "OrderQuantity",
      render: (_: any, record: SelectedProduct) => (
        <Input
          type="number"
          min={0}
          value={record.OrderQuantity}
          onChange={(e) =>
            setSelectedProducts((prev) =>
              prev.map((p) =>
                p.id === record.id
                  ? { ...p, OrderQuantity: Number(e.target.value) }
                  : p
              )
            )
          }
        />
      ),
    },
    {
      title: "Giá nhập",
      dataIndex: "supplyPrice",
      key: "supplyPrice",
      render: (_: any, record: SelectedProduct) => (
        <Input
          type="number"
          min={0}
          value={record.supplyPrice}
          onChange={(e) =>
            setSelectedProducts((prev) =>
              prev.map((p) =>
                p.id === record.id ? { ...p, supplyPrice: e.target.value } : p
              )
            )
          }
        />
      ),
    },
    {
      title: "Ngày sản xuất",
      dataIndex: "manufacturedDate",
      key: "manufacturedDate",
      render: (_: any, record: SelectedProduct) => (
        <Input
          type="date"
          value={record.manufacturedDate}
          onChange={(e) =>
            setSelectedProducts((prev) =>
              prev.map((p) =>
                p.id === record.id
                  ? { ...p, manufacturedDate: e.target.value }
                  : p
              )
            )
          }
        />
      ),
    },
    {
      title: "Ngày hết hạn",
      dataIndex: "expiredDate",
      key: "expiredDate",
      render: (_: any, record: SelectedProduct) => (
        <Input
          type="date"
          value={record.expiredDate}
          onChange={(e) =>
            setSelectedProducts((prev) =>
              prev.map((p) =>
                p.id === record.id ? { ...p, expiredDate: e.target.value } : p
              )
            )
          }
        />
      ),
    },
    {
      title: "Phòng kho",
      dataIndex: "storageRoomId",
      key: "storageRoomId",
      render: (_: any, record: SelectedProduct) => (
        <Select
          placeholder="Chọn kho..."
          value={record.storageRoomId}
          options={storageRoomOptions}
          onChange={(value) =>
            setSelectedProducts((prev) =>
              prev.map((p) =>
                p.id === record.id ? { ...p, storageRoomId: value } : p
              )
            )
          }
          style={{ width: "100%" }}
        />
      ),
    },
    {
      title: "Xóa",
      key: "action",
      render: (_: any, record: SelectedProduct) => (
        <Button danger onClick={() => handleRemoveProduct(record.id)}>
          🗑
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        background: "#fafbfe",
        borderRadius: "8px",
        marginTop: "60px",
      }}
    >
      <h2>Tạo mới lô hàng</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <Form layout="vertical" onFinish={handleSave}>
        <Form.Item label="Ấn nút để tạo mã lô hàng">
          {isLotCreated ? (
            <Input value={lotCode} disabled />
          ) : (
            <Button
              type="primary"
              onClick={handleCreateLot}
              className="bg-blue-500"
            >
              Tạo lô
            </Button>
          )}
        </Form.Item>

        {isLotCreated && (
          <>
            <Form.Item label="Sản phẩm" required>
              <Select
                showSearch
                options={productOptions}
                onChange={handleSelectProduct}
                placeholder="Chọn hoặc tìm kiếm sản phẩm..."
                style={{ width: "100%" }}
                filterOption={(input, option) =>
                  removeVietnameseDiacritics(option?.label ?? "")
                    .toLowerCase()
                    .includes(removeVietnameseDiacritics(input).toLowerCase())
                }
              />
            </Form.Item>

            {selectedProducts.length > 0 && (
              <Table
                columns={columns}
                dataSource={selectedProducts}
                rowKey="id"
                pagination={false}
                bordered
                style={{ marginTop: "20px" }}
              />
            )}
          </>
        )}

        <Space style={{ marginTop: "20px" }}>
          {isLotCreated && (
            <Button type="primary" htmlType="submit" className="bg-blue-500">
              Lưu
            </Button>
          )}
          <Button onClick={() => handleChangePage("Danh sách lô hàng")}>
            Quay lại
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AddLot;
