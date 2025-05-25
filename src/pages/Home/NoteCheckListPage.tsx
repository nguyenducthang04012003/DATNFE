import React, { useState, useEffect, useMemo } from "react";
import { Table, Button, Modal, Tag, message, Dropdown, Menu, Form, Select, Input, Row, Col } from "antd";
import { DownOutlined, EyeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import Cookies from "js-cookie";
import { useAuth, apiClient } from "../Home/AuthContext";
import dayjs from "dayjs";
import "dayjs/locale/vi";
// import viVN from "antd/lib/locale/vi_VN";
import { useNavigate } from "react-router-dom";

interface NoteCheck {
  noteCheckId: number;
  noteCheckCode: string | null;
  storageRoomId: number;
  reasonCheck: string;
  result: string;
  status: boolean;
  createdBy: number;
  createdDate: string;
  noteCheckDetails: NoteCheckDetail[];
}

interface NoteCheckDetail {
  noteCheckDetailId: number;
  noteCheckId: number;
  productLotId: number;
  storageQuantity: number;
  actualQuantity: number;
  differenceQuatity: number | null;
  errorQuantity: number;
  status: number;
  productLot: {
    productLotId: number;
    productId: number;
    lotId: number;
    product: {
      productName: string;
      productCode: string;
    };
  } | null;
}

interface ErrorProduct {
  productName: string;
  errorQuantity: number;
  lotId: string;
  noteCheckCode: string;
  noteCheckDetailId: number;
  errorStatus: string;
  productLotId?: number;
  lotCode?: string;
  createdDate?: string; // Thêm để lưu createdDate cho sắp xếp
}

interface StorageRoom {
  id: number;
  name: string;
}

interface ProductLot {
  id: number;
  lotId: number;
  productId: number;
  quantity: number | null;
  manufacturedDate: string;
  expiredDate: string;
  supplyPrice: number;
  orderQuantity: number;
  status: number;
  productName: string;
  lotCode: string;
  storageRoomId: number;
}

interface NoteCheckListPageProps {
  handleChangePage: (page: string) => void;
}

const NoteCheckListPage: React.FC<NoteCheckListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [noteChecks, setNoteChecks] = useState<NoteCheck[]>([]);
  const [errorProducts, setErrorProducts] = useState<ErrorProduct[]>([]);
  const [storageRooms, setStorageRooms] = useState<StorageRoom[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
  const [filterStorageRoomId, setFilterStorageRoomId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<boolean | null>(null);
  const [searchCode, setSearchCode] = useState<string>("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("User role:", user?.roleName);
    fetchNoteChecks();
    fetchErrorProducts();
    fetchStorageRooms();
  }, []);

  const fetchNoteChecks = async () => {
    setLoading(true);
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      const response = await apiClient.get("/NoteCheck", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedData = Array.isArray(response.data)
        ? response.data.sort((a: NoteCheck, b: NoteCheck) =>
            new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
          )
        : [];
      console.log("NoteChecks data:", sortedData);
      setNoteChecks(sortedData);
    } catch (error) {
      // message.error("Không thể tải danh sách phiếu kiểm kê");
      console.error(error);
      setNoteChecks([]);
    }
    setLoading(false);
  };

  const fetchErrorProducts = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      // Lấy danh sách sản phẩm lỗi
      const errorProductsResponse = await apiClient.get("/NoteCheck/all-error-products", {
        headers: { Authorization: `Bearer ${token}` },
        params: { cacheBust: Date.now() },
      });
      const errorProductsData = Array.isArray(errorProductsResponse.data) ? errorProductsResponse.data : [];
      console.log("Error products data:", errorProductsData);

      // Lấy danh sách phiếu kiểm kê để ánh xạ noteCheckDetailId với productLotId và createdDate
      const noteChecksResponse = await apiClient.get("/NoteCheck", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const noteChecksData = Array.isArray(noteChecksResponse.data) ? noteChecksResponse.data : [];
      console.log("Note checks for error products:", noteChecksData);

      // Lấy danh sách lô sản phẩm
      const productLotResponse = await apiClient.get("/ProductLot", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productLots: ProductLot[] = productLotResponse.data.data || [];
      console.log("Product lots data for error products:", productLots);

      // Ánh xạ productLotId, lotCode, và createdDate
      const enrichedErrorProducts = errorProductsData.map((product: ErrorProduct) => {
        // Tìm noteCheckDetail và noteCheck tương ứng
        let productLotId: number | undefined;
        let createdDate: string | undefined;
        for (const noteCheck of noteChecksData) {
          if (noteCheck.noteCheckCode === product.noteCheckCode) {
            createdDate = noteCheck.createdDate;
            const detail = noteCheck.noteCheckDetails.find(
              (d: NoteCheckDetail) => d.noteCheckDetailId === product.noteCheckDetailId
            );
            if (detail) {
              productLotId = detail.productLotId;
            }
            break;
          }
        }

        // Tìm productLot tương ứng
        const productLot = productLots.find((lot: ProductLot) => lot.id === productLotId);
        return {
          ...product,
          productLotId,
          lotCode: productLot ? productLot.lotCode : "Mã lô không xác định",
          createdDate,
        };
      });

      // Sắp xếp theo createdDate giảm dần (phiếu mới nhất lên đầu)
      const sortedErrorProducts = enrichedErrorProducts.sort((a, b) =>
        new Date(b.createdDate || 0).getTime() - new Date(a.createdDate || 0).getTime()
      );
      console.log("Sorted error products:", sortedErrorProducts);

      setErrorProducts(sortedErrorProducts);
    } catch (error) {
      // message.error("Không thể tải danh sách sản phẩm lỗi");
      console.error(error);
      setErrorProducts([]);
    }
  };

  const fetchStorageRooms = async () => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      const response = await apiClient.get("/StorageRoom/GetStorageRoomList", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rooms = response.data.data
        ? response.data.data
            .filter((room: any) => room.status === true)
            .map((room: any) => ({
              id: room.storageRoomId,
              name: room.storageRoomName,
            }))
        : [];
      console.log("Storage rooms data:", rooms);
      setStorageRooms(rooms);
    } catch (error) {
      // message.error("Không thể tải danh sách kho");
      console.error(error);
      setStorageRooms([]);
    }
  };

  const handleApproveNoteCheck = async (noteCheckId: number) => {
    console.log("Sending approve request:", { noteCheckId, method: "PUT", url: `/NoteCheck/${noteCheckId}/approve` });
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      await apiClient.put(
        `/NoteCheck/${noteCheckId}/approve`,
        { status: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Duyệt phiếu kiểm kê thành công");
      fetchNoteChecks();
    } catch (error: any) {
      // message.error(`Không thể duyệt phiếu kiểm kê: ${error.response?.data?.message || error.message}`);
      console.error(error);
    }
  };

  const handleViewDetails = async (noteCheckId: number) => {
    try {
      const token = Cookies.get("token");
      if (!token) {
        message.error("Không tìm thấy người dùng. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      // Lấy chi tiết phiếu kiểm kê
      const noteCheckResponse = await apiClient.get(`/NoteCheck/${noteCheckId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Note check details:", noteCheckResponse.data.noteCheckDetails);

      // Lấy danh sách lô sản phẩm
      const productLotResponse = await apiClient.get("/ProductLot", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const productLots: ProductLot[] = productLotResponse.data.data || [];
      console.log("Product lots data:", productLots);

      // Ánh xạ productLotId với productName và lotCode
      const enrichedDetails = noteCheckResponse.data.noteCheckDetails.map((detail: NoteCheckDetail) => {
        const productLot = productLots.find((lot: ProductLot) => lot.id === detail.productLotId);
        return {
          ...detail,
          productName: productLot ? productLot.productName : "Sản phẩm không có tên",
          lotCode: productLot ? productLot.lotCode : "Mã lô không xác định",
        };
      });

      Modal.info({
        title: `Chi tiết phiếu kiểm kê #${noteCheckResponse.data.noteCheckCode || noteCheckId}`,
        content: (
          <div>
            <p><strong>Kho:</strong> Kho {noteCheckResponse.data.storageRoomId}</p>
            <p><strong>Lý do kiểm kê:</strong> {noteCheckResponse.data.reasonCheck}</p>
            <p><strong>Kết quả:</strong> {noteCheckResponse.data.result}</p>
            <p>
              <strong>Ngày tạo:</strong>{" "}
              {dayjs(noteCheckResponse.data.createdDate).format("DD/MM/YYYY")}
            </p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              {noteCheckResponse.data.status ? "Đã duyệt" : "Chờ duyệt"}
            </p>
            <h4 className="mt-4">Chi tiết sản phẩm:</h4>
            <Table
              columns={[
                {
                  title: "Tên sản phẩm",
                  dataIndex: "productName",
                  key: "productName",
                  render: (text: string) => text || "Sản phẩm không có tên",
                },
                {
                  title: "Mã lô",
                  dataIndex: "lotCode",
                  key: "lotCode",
                  render: (text: string) => text || "Mã lô không xác định",
                },
                { title: "Số lượng kho", dataIndex: "storageQuantity", key: "storageQuantity" },
                { title: "Số lượng thực tế", dataIndex: "actualQuantity", key: "actualQuantity" },
                { title: "Chênh lệch", dataIndex: "differenceQuatity", key: "differenceQuatity" },
                { title: "Số lượng lỗi", dataIndex: "errorQuantity", key: "errorQuantity" },
              ]}
              dataSource={enrichedDetails}
              pagination={false}
              rowKey="noteCheckDetailId"
            />
          </div>
        ),
        width: 800,
        onOk() {},
      });
    } catch (error) {
      // message.error("Không thể tải chi tiết phiếu kiểm kê");
      console.error(error);
    }
  };

  const filteredNoteChecks = useMemo(() => {
    return noteChecks.filter(note => {
      if (searchCode && note.noteCheckCode && !note.noteCheckCode.toLowerCase().includes(searchCode.toLowerCase())) {
        return false;
      }
      if (filterStorageRoomId !== null && note.storageRoomId !== filterStorageRoomId) {
        return false;
      }
      if (filterStatus !== null && note.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [noteChecks, searchCode, filterStorageRoomId, filterStatus]);

  const handleResetFilters = () => {
    setFilterStorageRoomId(null);
    setFilterStatus(null);
    setSearchCode("");
    form.resetFields();
    fetchNoteChecks();
  };

  const columns = [
    {
      title: "Mã phiếu",
      dataIndex: "noteCheckCode",
      key: "noteCheckCode",
      render: (code: string | null) => code || "Không xác định",
    },
    {
      title: "Kho",
      dataIndex: "storageRoomId",
      key: "storageRoomId",
      render: (id: number) => {
        const room = storageRooms.find(r => r.id === id);
        return room ? room.name : `Kho ${id}`;
      },
    },
    {
      title: "Lý do kiểm kê",
      dataIndex: "reasonCheck",
      key: "reasonCheck",
    },
    {
      title: "Kết quả",
      dataIndex: "result",
      key: "result",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdDate",
      key: "createdDate",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean) =>
        status ? (
          <Tag color="green">Đã duyệt</Tag>
        ) : (
          <Tag color="gray">Chờ duyệt</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: NoteCheck) => {
        console.log("Rendering action for noteCheckId:", record.noteCheckId, "status:", record.status);
        const menu = (
          <Menu>
            <Menu.Item
              key="view"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record.noteCheckId)}
            >
              Xem chi tiết
            </Menu.Item>
            {(user?.roleName === "Director" || user?.roleName === "director") &&
              record.status === false && (
                <Menu.Item
                  key="approve"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleApproveNoteCheck(record.noteCheckId)}
                >
                  Duyệt phiếu
                </Menu.Item>
              )}
          </Menu>
        );

        return (
          <Dropdown overlay={menu} trigger={["click"]}>
            <Button>
              Hành động <DownOutlined />
            </Button>
          </Dropdown>
        );
      },
    },
  ];

  const errorColumns = [
    {
      title: "Tên sản phẩm",
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "Số lượng lỗi",
      dataIndex: "errorQuantity",
      key: "errorQuantity",
    },
    {
      title: "Mã lô",
      dataIndex: "lotCode",
      key: "lotCode",
      render: (text: string) => text || "Mã lô không xác định",
    },
    {
      title: "Mã phiếu kiểm kê",
      dataIndex: "noteCheckCode",
      key: "noteCheckCode",
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Danh sách phiếu kiểm kê</h1>
        <Button type="primary" onClick={() => handleChangePage("Tạo phiếu kiểm kê")}>
          Tạo phiếu kiểm kê
        </Button>
      </div>
      <Form form={form} layout="vertical" className="mb-4">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Tìm kiếm mã phiếu">
              <Input.Search
                placeholder="Nhập mã phiếu kiểm kê"
                value={searchCode}
                onChange={e => setSearchCode(e.target.value)}
                allowClear
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Kho" name="filterStorageRoomId">
              <Select
                placeholder="Chọn kho"
                allowClear
                onChange={(value: number | undefined) => setFilterStorageRoomId(value || null)}
              >
                {storageRooms.map(room => (
                  <Select.Option key={room.id} value={room.id}>
                    {room.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Trạng thái" name="filterStatus">
              <Select
                placeholder="Chọn trạng thái"
                allowClear
                onChange={(value: boolean | undefined) => setFilterStatus(value ?? null)}
              >
                <Select.Option value={false}>Chờ duyệt</Select.Option>
                <Select.Option value={true}>Đã duyệt</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: "right" }}>
            <Button type="default" onClick={handleResetFilters}>
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Form>
      {filteredNoteChecks.length === 0 && !loading && (
        <p className="text-red-500 mb-4">Không có phiếu kiểm kê nào khớp với bộ lọc.</p>
      )}
      <Table
        columns={columns}
        dataSource={filteredNoteChecks}
        rowKey="noteCheckId"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <div className="mt-6">
        {/* <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Danh sách sản phẩm lỗi</h2>
          <Button type="primary" onClick={() => setErrorModalVisible(true)}>
            Xem sản phẩm lỗi
          </Button>
        </div> */}
        <Modal
          title="Danh sách sản phẩm lỗi"
          open={errorModalVisible}
          onCancel={() => setErrorModalVisible(false)}
          footer={null}
          width={800}
        >
          <Table
            columns={errorColumns}
            dataSource={errorProducts}
            rowKey="noteCheckDetailId"
            pagination={{ pageSize: 10 }}
          />
        </Modal>
      </div>
    </div>
  );
};

export default NoteCheckListPage;