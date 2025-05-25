import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Button,
  Card,
  Col,
  Divider,
  Image,
  InputNumber,
  message,
  Row,
  Select,
  Typography,
  Space,
  Collapse,
  Input,
  Modal,
  Carousel,
  Pagination,
} from "antd";
import {
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Cookies from "js-cookie";
import { useAuth } from "../../pages/Home/AuthContext";

interface Category {
  id: number;
  categoryMainId: number | null;
  categoryName: string;
  categoryCode: string;
  image?: string;
  subCategories: Category[];
}

interface Product {
  productId: number;
  productCode: string;
  manufactureName: string;
  productName: string;
  unit: string;
  categoryName: string;
  description: string;
  sellingPrice: number;
  createdBy: number;
  createdDate: string | null;
  status: boolean;
  vat: number;
  storageconditions: string;
  weight: number;
  volumePerUnit: number;
  images: string[];
  totalQuantity: number;
}

interface OrderDetail {
  cartId: number;
  orderDetailId: number;
  productId: number;
  productName: string;
  price: number;
  image?: string;
  quantity: number;
}

const { Title, Text } = Typography;
const { Option } = Select;

const formatCurrency = (value: number): string => {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const NewOrder: React.FC = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<OrderDetail[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] =
    useState<string>("");
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(9);
  const [sortOrder, setSortOrder] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/Category/subcategory`)
      .then((response) => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setCategories(data);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy danh mục:", error);
        message.error("Không thể lấy danh sách danh mục.");
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/Product/ListProductCustomer`)
      .then(async (response) => {
        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        const validProducts = data.filter(
          (product: Product) =>
            product.productId &&
            product.productName &&
            typeof product.sellingPrice === "number"
        );

        const productsWithQuantity = await Promise.all(
          validProducts.map(async (product: Product) => {
            try {
              const quantityResponse = await axios.get(
                `${API_BASE_URL}/ProductLot/CheckProductQuantity/${product.productId}`,
                {
                  headers: { accept: "*/*" },
                }
              );
              return {
                ...product,
                totalQuantity: quantityResponse.data.quantity || 0,
              };
            } catch (error) {
              console.error(
                `Lỗi khi lấy số lượng sản phẩm ${product.productId}:`,
                error
              );
              return { ...product, totalQuantity: 0 };
            }
          })
        );

        setProducts(productsWithQuantity);
        setFilteredProducts(productsWithQuantity);
        setCurrentPage(1);
      })
      .catch((error) => {
        console.error("Lỗi khi lấy sản phẩm:", error);
        message.error("Không thể lấy danh sách sản phẩm.");
      });
  }, []);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/GHN/provinces`)
      .then((response) => {
        setProvinces(response.data.data || []);
      })
      .catch((error) => {
        console.error(
          "Chi tiết lỗi 404:",
          error.response?.status,
          error.response?.data
        );
        console.error("Lỗi khi lấy tỉnh thành:", error);
        message.error("Không thể lấy danh sách tỉnh thành phố.");
      });
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      axios
        .get(`${API_BASE_URL}/GHN/districts/${selectedProvince}`)
        .then((response) => {
          setDistricts(response.data.data || []);
          setSelectedDistrict(null);
          setSelectedWard(null);
        })
        .catch((error) => {
          console.error("Lỗi khi lấy quận huyện:", error);
          message.error("Không thể lấy danh sách quận huyện.");
        });
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      axios
        .get(`${API_BASE_URL}/GHN/wards/${selectedDistrict}`)
        .then((response) => {
          setWards(response.data.data || []);
          setSelectedWard(null);
        })
        .catch((error) => {
          console.error("Lỗi khi lấy phường xã:", error);
          message.error("Không thể lấy danh sách phường xã.");
        });
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // Tải danh sách tỉnh
  // useEffect(() => {
  //   axios
  //     .get("https://provinces.open-api.vn/api/p/")
  //     .then((res) => setProvinces(res.data))
  //     .catch(() => message.error("Không lấy được danh sách tỉnh thành!"));
  // }, []);

  // // Khi chọn tỉnh, lấy danh sách quận/huyện theo tỉnh
  // useEffect(() => {
  //   if (selectedProvince) {
  //     axios
  //       .get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`)
  //       .then((res) => {
  //         setDistricts(res.data.districts || []);
  //         setSelectedDistrict(null);
  //         setSelectedWard(null);
  //       })
  //       .catch(() => message.error("Không lấy được danh sách quận huyện!"));
  //   } else {
  //     setDistricts([]);
  //     setWards([]);
  //   }
  // }, [selectedProvince]);

  // // Khi chọn quận, lấy danh sách phường/xã theo quận
  // useEffect(() => {
  //   if (selectedDistrict) {
  //     axios
  //       .get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`)
  //       .then((res) => {
  //         setWards(res.data.wards || []);
  //         setSelectedWard(null);
  //       })
  //       .catch(() => message.error("Không lấy được danh sách phường xã!"));
  //   } else {
  //     setWards([]);
  //   }
  // }, [selectedDistrict]);

  const calculateShippingFee = () => {
    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      message.warning("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
      return;
    }

    if (orderItems.length === 0) {
      message.warning("Giỏ hàng trống, không thể tính phí vận chuyển!");
      return;
    }

    const totalWeight = orderItems.reduce((acc, item) => {
      const product = products.find((p) => p.productId === item.productId);
      return acc + (product ? product.weight * item.quantity * 1000 : 0);
    }, 0);

    if (totalWeight <= 0) {
      message.error(
        "Không thể tính phí vận chuyển do khối lượng không hợp lệ!"
      );
      return;
    }

    const payload = {
      from_district_id: 1542,
      from_ward_code: "1B1507",
      service_type_id: 2,
      to_district_id: selectedDistrict,
      to_ward_code: selectedWard.toString(),
      weight: Math.round(totalWeight),
    };
    console.log("Payload tính phí vận chuyển:", payload); // Debug: Xem payload gửi đi

    axios
      .post(`${API_BASE_URL}/GHN/calculate-fee`, payload, {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      })
      .then((response) => {
        console.log(response.data);
        if (response.data.success) {
          setShippingFee(response.data.data.total || 0);
          message.success("Tính phí vận chuyển thành công!");
        } else {
          message.error(
            response.data.message || "Không thể tính phí vận chuyển."
          );
        }
      })
      .catch((error) => {
        console.log(error);
        console.error("Lỗi khi tính phí vận chuyển:", error);
        message.error("Không thể tính phí vận chuyển.");
      });
    console.log("end");
    // setShippingFee(30000);
    // message.success("Tính phí vận chuyển thành công!");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}/${date.getFullYear()}`;
  };

  const calculateEstimatedDeliveryTime = () => {
    if (selectedProvince && selectedDistrict && selectedWard) {
      axios
        .post(`${API_BASE_URL}/GHN/calculate-expected-delivery-time`, null, {
          params: {
            fromDistrictId: 1542,
            fromWardCode: "1B1507",
            toDistrictId: selectedDistrict,
            toWardCode: selectedWard,
          },
        })
        .then((response) => {
          message.success("Tính thời gian giao hàng thành công!");
          setEstimatedDeliveryTime(
            formatDate(
              response.data.data.expectedDeliveryTime ||
                response.data.data.expectedDeliveryDate
            )
          );
        })
        .catch((error) => {
          console.error("Lỗi khi tính thời gian giao hàng:", error);
          message.error("Không thể tính thời gian giao hàng.");
        });
    }
  };

  // const calculateEstimatedDeliveryTime = () => {
  //   if (selectedProvince && selectedDistrict && selectedWard) {
  //     const today = new Date();
  //     const deliveryDate = new Date(today);
  //     deliveryDate.setDate(today.getDate() + 3);

  //     // Dùng hàm đổi tên để không bị lỗi trùng
  //     const formattedDate = deliveryDate.toLocaleDateString("vi-VN");

  //     setEstimatedDeliveryTime(formattedDate);
  //     message.success("Dự kiến giao hàng trong 3 ngày.");
  //   } else {
  //     message.warning("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
  //   }
  // };

  const removeVietnameseTones = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  };

  const handleFilter = () => {
    const normalizedKeyword = removeVietnameseTones(
      searchKeyword.toLowerCase()
    );
    const selectedCategoryName = selectedCategory
      ? categories.find((cat) => cat.id === selectedCategory)?.categoryName
      : null;

    let filtered = products.filter((product) => {
      const productName = product.productName || "";
      const normalizedProductName = removeVietnameseTones(
        productName.toLowerCase()
      );
      const matchesKeyword = normalizedKeyword
        ? normalizedProductName.includes(normalizedKeyword)
        : true;

      const matchesCategory =
        selectedCategoryName === null ||
        product.categoryName === selectedCategoryName;

      const matchesPrice =
        (!minPrice || product.sellingPrice >= minPrice) &&
        (!maxPrice || product.sellingPrice <= maxPrice);

      return matchesKeyword && matchesCategory && matchesPrice;
    });

    if (sortOrder) {
      filtered = filtered.sort((a, b) => {
        const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
        const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
        if (sortOrder === "dateAsc") return dateA - dateB;
        if (sortOrder === "dateDesc") return dateB - dateA;
        return 0;
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    handleFilter();
  }, [
    searchKeyword,
    selectedCategory,
    minPrice,
    maxPrice,
    products,
    sortOrder,
  ]);

  useEffect(() => {
    const cartFromCookie = Cookies.get("cart");
    if (cartFromCookie) {
      setOrderItems(JSON.parse(cartFromCookie));
    }
  }, []);

  const addToCart = (product: Product) => {
    const existingItem = orderItems.find(
      (item) => item.productId === product.productId
    );
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    if (currentQuantity + 1 > product.totalQuantity) {
      message.error(
        `Không thể thêm ${product.productName}. Số lượng tồn kho chỉ còn ${product.totalQuantity}.`
      );
      return;
    }

    axios
      .post(
        `${API_BASE_URL}/Cart/AddToCart`,
        { productId: product.productId, quantity: 1 },
        {
          headers: { "Content-Type": "application/json" },
        }
      )
      .then((response) => {
        if (response.data.success) {
          setOrderItems((prev) => {
            const existingItem = prev.find(
              (item) => item.productId === product.productId
            );
            const updatedItems = existingItem
              ? prev.map((item) =>
                  item.productId === product.productId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                )
              : [
                  ...prev,
                  {
                    cartId: 0,
                    orderDetailId: Date.now(),
                    productId: product.productId,
                    productName: product.productName,
                    price: product.sellingPrice,
                    image: product.images[0],
                    quantity: 1,
                  },
                ];
            Cookies.set("cart", JSON.stringify(updatedItems), { expires: 7 });
            return updatedItems;
          });
          message.success(`Thêm ${product.productName} vào giỏ hàng`);
        }
      })
      .catch((error) => {
        console.error("Lỗi khi thêm vào giỏ hàng:", error);
        message.error("Không thể thêm sản phẩm vào giỏ hàng.");
      });
  };

  const updateQuantity = (productId: number, value: number) => {
    const product = products.find((p) => p.productId === productId);
    if (!product) return;

    if (value > product.totalQuantity) {
      message.error(
        `Số lượng không được vượt quá ${product.totalQuantity} (tồn kho).`
      );
      return;
    }

    axios
      .put(`${API_BASE_URL}/Cart/UpdateCart/${productId}/${value}`)
      .then((response) => {
        if (response.data.success) {
          setOrderItems((prev) => {
            const updatedItems = prev.map((item) =>
              item.productId === productId ? { ...item, quantity: value } : item
            );
            Cookies.set("cart", JSON.stringify(updatedItems), { expires: 7 });
            return updatedItems;
          });
          message.success("Cập nhật số lượng thành công");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật số lượng:", error);
        setOrderItems((prev) => {
          const updatedItems = prev.map((item) =>
            item.productId === productId ? { ...item, quantity: value } : item
          );
          Cookies.set("cart", JSON.stringify(updatedItems), { expires: 7 });
          return updatedItems;
        });
      });
  };

  const removeItem = (productId: number) => {
    axios
      .delete(`${API_BASE_URL}/Cart/RemoveFromCart/${productId}`)
      .then((response) => {
        if (response.data.success) {
          setOrderItems((prev) => {
            const updatedItems = prev.filter(
              (item) => item.productId !== productId
            );
            Cookies.set("cart", JSON.stringify(updatedItems), { expires: 7 });
            return updatedItems;
          });
          message.success("Xóa sản phẩm khỏi giỏ hàng");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi xóa sản phẩm:", error);
        setOrderItems((prev) => {
          const updatedItems = prev.filter(
            (item) => item.productId !== productId
          );
          Cookies.set("cart", JSON.stringify(updatedItems), { expires: 7 });
          return updatedItems;
        });
      });
  };

  const subtotal = orderItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = orderItems.reduce((acc, item) => {
    const product = products.find((p) => p.productId === item.productId);
    return acc + item.price * item.quantity * (product ? product.vat / 100 : 0);
  }, 0);
  // Total for display includes shipping fee
  const total = subtotal + tax + (shippingFee || 0);

  const handleCheckout = () => {
    if (!user) {
      message.warning("Vui lòng đăng nhập để đặt hàng!");
      return;
    }

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      message.warning("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
      return;
    }

    if (!user.address) {
      message.warning(
        "Thông tin người dùng không có địa chỉ. Vui lòng cập nhật địa chỉ!"
      );
      return;
    }

    if (orderItems.length === 0) {
      message.warning("Giỏ hàng trống, không thể đặt hàng!");
      return;
    }

    if (shippingFee === null) {
      message.warning("Vui lòng tính phí vận chuyển trước khi đặt hàng!");
      return;
    }

    for (const item of orderItems) {
      const product = products.find((p) => p.productId === item.productId);
      if (product && item.quantity > product.totalQuantity) {
        message.error(
          `Sản phẩm ${item.productName} có số lượng (${item.quantity}) vượt quá số lượng tồn kho (${product.totalQuantity}). Vui lòng điều chỉnh số lượng.`
        );
        return;
      }
    }

    const token = Cookies.get("token");
    const payload = {
      customerId: user.customerId,
      updatedStatusDate: new Date().toISOString(),
      stockReleaseDate: new Date().toISOString(),
      totalAmount: Math.round(subtotal + tax),
      // wardCode: selectedWard?.toString() || "", // ✅ Fix ở đây
      wardCode: selectedWard || "",

      districtId: selectedDistrict || 0,
      deliveryFee: shippingFee || 0,
      address: user.address,
      createdDate: new Date().toISOString(),
      status: 1,
      ordersDetails: orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    // console.log("Payload gửi đi:", payload);

    axios
      .post(`${API_BASE_URL}/Order/CheckOut`, payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.data.success) {
          message.success("Đặt hàng thành công!");
          setOrderItems([]);
          Cookies.remove("cart");
          setSelectedProvince(null);
          setSelectedDistrict(null);
          setSelectedWard(null);
          setShippingFee(null);
          setEstimatedDeliveryTime("");
        } else {
          message.error(response.data.message || "Không thể tạo đơn hàng!");
        }
      })
      .catch((error) => {
        console.error("Lỗi khi tạo đơn hàng:", error);
        message.error(
          "Lỗi khi đặt hàng: " +
            (error.response?.data?.message || error.message)
        );
      });
  };

  const NextArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "block",
          color: "#fff",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          lineHeight: "40px",
          textAlign: "center",
          fontSize: "20px",
          right: "10px",
        }}
        onClick={onClick}
      >
        <RightOutlined />
      </div>
    );
  };

  const PrevArrow = (props: any) => {
    const { className, style, onClick } = props;
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "block",
          color: "#fff",
          background: "rgba(0, 0, 0, 0.5)",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          lineHeight: "40px",
          textAlign: "center",
          fontSize: "20px",
          left: "10px",
          zIndex: 1,
        }}
        onClick={onClick}
      >
        <LeftOutlined />
      </div>
    );
  };

  const handleImagePreview = (images: string[]) => {
    setPreviewImages(images);
    setPreviewOpen(true);
  };

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size && size !== pageSize) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  return (
    <div style={{ padding: 20, marginTop: 60 }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Title level={4} style={{ marginBottom: "16px", color: "#1a3c34" }}>
              Tìm kiếm sản phẩm
            </Title>
            <Space
              direction="horizontal"
              style={{ marginBottom: "16px", width: "100%" }}
            >
              <Input
                placeholder="Nhập tên sản phẩm"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                prefix={<SearchOutlined />}
                style={{ width: "300px", borderRadius: "4px" }}
                allowClear
              />
              <Button
                onClick={() => setShowFilter(!showFilter)}
                icon={<FilterOutlined />}
                style={{
                  borderRadius: "4px",
                  background: "#1890ff",
                  color: "#fff",
                  border: "none",
                  transition: "all 0.3s",
                }}
              >
                Lọc nâng cao
              </Button>
            </Space>

            {showFilter && (
              <Collapse
                defaultActiveKey={["1"]}
                items={[
                  {
                    key: "1",
                    label: "Lọc nâng cao",
                    children: (
                      <Space direction="vertical" style={{ marginBottom: 16 }}>
                        <Select
                          placeholder="Chọn danh mục"
                          value={selectedCategory}
                          onChange={(value) => setSelectedCategory(value)}
                          style={{ width: 200, borderRadius: "4px" }}
                          allowClear
                        >
                          {categories.map((category) => (
                            <Option key={category.id} value={category.id}>
                              {category.categoryName}
                            </Option>
                          ))}
                        </Select>
                        <Select
                          placeholder="Lọc khoảng giá"
                          style={{ width: 200, borderRadius: "4px" }}
                          value={
                            minPrice !== null && maxPrice !== null
                              ? `${minPrice}-${maxPrice}`
                              : undefined
                          }
                          onChange={(value) => {
                            const [min, max] = value.split("-").map(Number);
                            setMinPrice(isNaN(min) ? null : min);
                            setMaxPrice(isNaN(max) ? null : max);
                          }}
                          allowClear
                        >
                          <Option value="0-50000">Dưới 50k</Option>
                          <Option value="0-100000">Dưới 100k</Option>
                          <Option value="100000-500000">100k - 500k</Option>
                          <Option value="500000-1000000">500k - 1 triệu</Option>
                          <Option value="1000000-999999999">
                            Trên 1 triệu
                          </Option>
                        </Select>
                        <Select
                          placeholder="Sắp xếp theo ngày tạo"
                          value={sortOrder}
                          onChange={(value) => setSortOrder(value)}
                          style={{ width: 200, borderRadius: "4px" }}
                          allowClear
                        >
                          <Option value="dateAsc">Ngày tạo: Cũ nhất</Option>
                          <Option value="dateDesc">Ngày tạo: Mới nhất</Option>
                        </Select>
                        <Button
                          type="default"
                          danger
                          onClick={() => {
                            setSearchKeyword("");
                            setSelectedCategory(null);
                            setMinPrice(null);
                            setMaxPrice(null);
                            setSortOrder(null);
                            setFilteredProducts(products);
                            setCurrentPage(1);
                            message.success("Đã xóa tất cả bộ lọc!");
                          }}
                          style={{ borderRadius: "4px" }}
                        >
                          Xóa bộ lọc
                        </Button>
                      </Space>
                    ),
                  },
                ]}
                style={{ background: "#fafafa", borderRadius: "4px" }}
              />
            )}

            <Row gutter={[16, 16]} style={{ marginTop: "24px" }}>
              {filteredProducts.length === 0 ? (
                <Col span={24}>
                  <Text style={{ color: "#888" }}>
                    Không tìm thấy sản phẩm nào phù hợp.
                  </Text>
                </Col>
              ) : paginatedProducts.length === 0 ? (
                <Col span={24}>
                  <Text style={{ color: "#888" }}>
                    Không có sản phẩm nào ở trang này.
                  </Text>
                </Col>
              ) : (
                paginatedProducts.map((product) => (
                  <Col
                    key={product.productId}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={8}
                    xl={8}
                  >
                    <Card
                      hoverable
                      style={{
                        borderRadius: "8px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "transform 0.3s",
                        height: "100%",
                      }}
                      styles={{
                        body: {
                          padding: "12px",
                        },
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "scale(1.03)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                      cover={
                        <Image
                          src={
                            product.images[0] ||
                            "assets/img/product/noimage.png"
                          }
                          alt={product.productName}
                          style={{
                            height: "180px",
                            objectFit: "cover",
                            borderTopLeftRadius: "8px",
                            borderTopRightRadius: "8px",
                          }}
                          preview={false}
                          onClick={() => handleImagePreview(product.images)}
                        />
                      }
                    >
                      <div style={{ textAlign: "center" }}>
                        <Title
                          level={5}
                          ellipsis={{ tooltip: product.productName }}
                          style={{
                            margin: "8px 0",
                            fontSize: "16px",
                            color: "#333",
                          }}
                        >
                          {product.productName}
                        </Title>
                        <Text
                          strong
                          style={{ color: "#1890ff", fontSize: "16px" }}
                        >
                          {formatCurrency(product.sellingPrice)} VND
                        </Text>
                        <br />
                        <Text style={{ color: "#888", fontSize: "12px" }}>
                          Tồn kho: {product.totalQuantity}
                        </Text>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => addToCart(product)}
                          style={{
                            marginTop: "12px",
                            width: "100%",
                            borderRadius: "4px",
                            background: "#1890ff",
                            border: "none",
                            transition: "all 0.3s",
                          }}
                        >
                          Thêm vào giỏ
                        </Button>
                      </div>
                    </Card>
                  </Col>
                ))
              )}
            </Row>

            {filteredProducts.length > 0 && (
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredProducts.length}
                onChange={handlePageChange}
                showSizeChanger
                pageSizeOptions={["9", "18", "27"]}
                style={{
                  marginTop: "24px",
                  textAlign: "center",
                  background: "#fff",
                  padding: "8px",
                  borderRadius: "4px",
                }}
              />
            )}
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Title level={4} style={{ marginBottom: "16px", color: "#1a3c34" }}>
              Giỏ hàng
            </Title>
            {orderItems.length === 0 ? (
              <Text style={{ color: "#888" }}>Giỏ hàng trống</Text>
            ) : (
              <div>
                <div
                  style={{
                    borderBottom: "1px solid #e8e8e8",
                    paddingBottom: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <Row>
                    <Col span={6}>
                      <Text strong>Sản phẩm</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Giá</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Số lượng</Text>
                    </Col>
                    <Col span={6}>
                      <Text strong>Tổng</Text>
                    </Col>
                  </Row>
                </div>
                {orderItems.map((item) => (
                  <Row
                    key={item.orderDetailId}
                    style={{
                      marginBottom: "16px",
                      padding: "8px",
                      borderRadius: "4px",
                      background: "#fafafa",
                      alignItems: "center",
                    }}
                  >
                    <Col span={6}>
                      <Image
                        src={item.image || "assets/img/product/noimage.png"}
                        alt={item.productName}
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                      <Text
                        ellipsis
                        style={{ marginLeft: "8px", fontSize: "12px" }}
                      >
                        {item.productName}
                      </Text>
                    </Col>
                    <Col span={6}>
                      <Text>{formatCurrency(item.price)} VND</Text>
                    </Col>
                    <Col span={6}>
                      <InputNumber
                        min={1}
                        value={item.quantity}
                        onChange={(value) =>
                          updateQuantity(item.productId, value || 1)
                        }
                        style={{ width: "60px", borderRadius: "4px" }}
                      />
                    </Col>
                    <Col span={6}>
                      <Text strong>
                        {formatCurrency(item.price * item.quantity)} VND
                      </Text>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeItem(item.productId)}
                        style={{ marginLeft: "8px", borderRadius: "4px" }}
                      />
                    </Col>
                  </Row>
                ))}
                <Divider />
                <Row justify="end">
                  <Col>
                    <Text strong style={{ fontSize: "16px" }}>
                      Tổng cộng: {formatCurrency(subtotal)} VND
                    </Text>
                  </Col>
                </Row>
              </div>
            )}

            <Divider />
            <Title level={4} style={{ marginBottom: "16px", color: "#1a3c34" }}>
              Thông tin giao hàng
            </Title>
            {user && (
              <Text strong style={{ display: "block", marginBottom: "16px" }}>
                Địa chỉ: {user.address}
              </Text>
            )}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Select
                  placeholder="Chọn tỉnh"
                  value={selectedProvince || undefined}
                  onChange={(value) => setSelectedProvince(value)}
                  style={{
                    width: "100%",
                    minWidth: "200px",
                    borderRadius: "4px",
                  }}
                  dropdownStyle={{ minWidth: "300px" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {provinces.map((province) => (
                    // <Option key={province.code} value={province.code}>
                    //   {province.name}
                    // </Option>
                    <Option
                      key={province.provinceID}
                      value={province.provinceID}
                    >
                      {province.provinceName}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24}>
                <Select
                  placeholder="Chọn quận/huyện"
                  value={selectedDistrict || undefined}
                  onChange={(value) => setSelectedDistrict(value)}
                  style={{
                    width: "100%",
                    minWidth: "200px",
                    borderRadius: "4px",
                  }}
                  dropdownStyle={{ minWidth: "300px" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={!selectedProvince}
                >
                  {districts.map((district) => (
                    // <Option key={district.code} value={district.code}>
                    //   {district.name}
                    // </Option>
                    <Option
                      key={district.districtID}
                      value={district.districtID}
                    >
                      {district.districtName}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24}>
                <Select
                  placeholder="Chọn phường/xã"
                  value={selectedWard || undefined}
                  onChange={(value) => setSelectedWard(value)}
                  style={{
                    width: "100%",
                    minWidth: "200px",
                    borderRadius: "4px",
                  }}
                  dropdownStyle={{ minWidth: "300px" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  disabled={!selectedDistrict}
                >
                  {wards.map((ward) => (
                    // <Option key={ward.code} value={ward.code}>
                    //   {ward.name}
                    // </Option>
                    <Option key={ward.wardCode} value={ward.wardCode}>
                      {ward.wardName}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
              <Col xs={24} sm={12}>
                <Button
                  type="primary"
                  block
                  onClick={calculateShippingFee}
                  style={{
                    borderRadius: "4px",
                    background: "#1890ff",
                    border: "none",
                  }}
                >
                  Tính phí vận chuyển
                </Button>
              </Col>
              <Col xs={24} sm={12}>
                <Button
                  type="primary"
                  block
                  onClick={calculateEstimatedDeliveryTime}
                  style={{
                    borderRadius: "4px",
                    background: "#1890ff",
                    border: "none",
                  }}
                >
                  Tính thời gian giao hàng
                </Button>
              </Col>
            </Row>
            {shippingFee !== null && (
              <Text
                strong
                style={{
                  display: "block",
                  marginTop: "16px",
                  color: "#1890ff",
                }}
              >
                Phí vận chuyển: {formatCurrency(shippingFee)} VND
              </Text>
            )}
            {estimatedDeliveryTime && (
              <Text
                strong
                style={{ display: "block", marginTop: "8px", color: "#888" }}
              >
                Thời gian giao hàng dự kiến: {estimatedDeliveryTime}
              </Text>
            )}
            <div
              style={{
                marginTop: "24px",
                padding: "16px",
                background: "#fafafa",
                borderRadius: "4px",
              }}
            >
              <Row justify="space-between">
                <Col>
                  <Text strong style={{ fontSize: "16px" }}>
                    Tiền hàng:
                  </Text>
                </Col>
                <Col>
                  <Text strong style={{ fontSize: "16px" }}>
                    {formatCurrency(subtotal)} VND
                  </Text>
                </Col>
              </Row>
              <Row justify="space-between" style={{ marginTop: "8px" }}>
                <Col>
                  <Text strong style={{ fontSize: "16px" }}>
                    Thuế (GTGT):
                  </Text>
                </Col>
                <Col>
                  <Text strong style={{ fontSize: "16px" }}>
                    {formatCurrency(tax)} VND
                  </Text>
                </Col>
              </Row>
              {shippingFee !== null && (
                <Row justify="space-between" style={{ marginTop: "8px" }}>
                  <Col>
                    <Text strong style={{ fontSize: "16px" }}>
                      Phí vận chuyển:
                    </Text>
                  </Col>
                  <Col>
                    <Text strong style={{ fontSize: "16px" }}>
                      {formatCurrency(shippingFee)} VND
                    </Text>
                  </Col>
                </Row>
              )}
              <Row justify="space-between" style={{ marginTop: "8px" }}>
                <Col>
                  <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                    Tổng tiền hàng:
                  </Text>
                </Col>
                <Col>
                  <Text strong style={{ fontSize: "18px", color: "#1890ff" }}>
                    {formatCurrency(total)} VND
                  </Text>
                </Col>
              </Row>
              <Button
                type="primary"
                onClick={handleCheckout}
                style={{
                  marginTop: "16px",
                  width: "100%",
                  height: "48px",
                  borderRadius: "4px",
                  border: "none",
                  fontSize: "16px",
                  transition: "all 0.3s",
                }}
                disabled={orderItems.length === 0}
              >
                Đặt hàng
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      <Modal
        open={previewOpen}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        styles={{ body: { padding: "16px" } }}
      >
        <Carousel arrows prevArrow={<PrevArrow />} nextArrow={<NextArrow />}>
          {previewImages.map((img, index) => (
            <div key={index} style={{ textAlign: "center" }}>
              <Image
                src={img}
                alt={`Image ${index + 1}`}
                style={{
                  maxHeight: "400px",
                  maxWidth: "100%",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>
          ))}
        </Carousel>
      </Modal>
    </div>
  );
};

export default NewOrder;
