import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBagShopping,
  faFileLines,
  faMoneyBills,
} from "@fortawesome/free-solid-svg-icons";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import axios from "axios";

interface Supplier {
  supplierId: number | null;
  amountPaid: number;
  supplier: { supplierName: string } | null;
}

interface PurchaseOrder {
  purchaseOrderId: number;
  totalAmount: number;
  createdDate: string;
}

interface Order {
  orderId: number;
  totalAmount: number;
  createdDate: string;
  customerId: number;
}

interface Customer {
  customerId: number;
  totalRevenue: number;
  customer: { firstName: string; lastName: string };
}

interface OrderDetail {
  orderDetailId: number;
  orderId: number | null; // May be null in current API
  productId: number;
  quantity: number | null;
  totalQuantity: number;
  product: { productId: number; productName: string; sellingPrice: number };
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPurchase, setTotalPurchase] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseData, setPurchaseData] = useState<PurchaseOrder[]>([]);
  const [orderData, setOrderData] = useState<Order[]>([]);
  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [productData, setProductData] = useState<OrderDetail[]>([]);
  const [startMonth, setStartMonth] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [monthOptions, setMonthOptions] = useState<string[]>([]);
  const [rangeError, setRangeError] = useState<string | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Hàm so sánh hai tháng
  const compareMonths = (monthA: string, monthB: string): number => {
    const [monthANum, yearANum] = monthA.split("-").map(Number);
    const [monthBNum, yearBNum] = monthB.split("-").map(Number);
    if (yearANum !== yearBNum) return yearANum - yearBNum;
    return monthANum - monthBNum;
  };

  // Filter data by date range
  const filterByDateRange = <T extends { createdDate?: string }>(
    data: T[],
    dateField: keyof T = "createdDate"
  ): T[] => {
    if (!startMonth || !endMonth) return data;
    const [startMonthNum, startYear] = startMonth.split("-").map(Number);
    const [endMonthNum, endYear] = endMonth.split("-").map(Number);
    const startDate = new Date(startYear, startMonthNum - 1, 1);
    const endDate = new Date(endYear, endMonthNum, 0); // Last day of end month

    return data.filter(item => {
      const dateStr = item[dateField] as string;
      if (!dateStr) return false;
      const date = new Date(dateStr);
      return date >= startDate && date <= endDate;
    });
  };

  // Aggregate OrderDetail by product
  const aggregateOrderDetails = (orderDetails: OrderDetail[], filteredOrders: Order[]): OrderDetail[] => {
    // Since orderId is null in API, we assume all details are valid for now
    // If orderId were available, we'd filter by matching orderId to filteredOrders
    const productMap = new Map<number, OrderDetail>();

    orderDetails.forEach(detail => {
      const productId = detail.productId;
      // Check if detail's orderId matches a filtered order (if orderId exists)
      const order = detail.orderId
        ? filteredOrders.find(o => o.orderId === detail.orderId)
        : null;
      // If orderId is null (current API), include all details (fallback)
      // Ideally, we'd only include details where orderId matches a filtered order
      if (!detail.orderId || order) {
        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          productMap.set(productId, {
            ...existing,
            totalQuantity: existing.totalQuantity + detail.totalQuantity,
          });
        } else {
          productMap.set(productId, {
            ...detail,
            totalQuantity: detail.totalQuantity,
          });
        }
      }
    });

    return Array.from(productMap.values());
  };

  // Fetch data from API and generate month options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          suppliersRes,
          purchasesRes,
          customersRes,
          productsRes,
          ordersRes,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/PurchaseOrders/GetTopSupplierList?topSupplier=10`),
          axios.get(`${API_BASE_URL}/PurchaseOrders/GetPurchaseOrdersRevenueList`),
          axios.get(`${API_BASE_URL}/Order/GetTopCustomerRevenue?topCustomer=10`),
          axios.get(`${API_BASE_URL}/Order/GetAllOrderDetails?topProduct=10`),
          axios.get(`${API_BASE_URL}/Order/GetOrdersRevenueList`),
        ]);

        const suppliers: Supplier[] = suppliersRes.data.data;
        const purchases: PurchaseOrder[] = purchasesRes.data.data.map((p: any) => ({
          purchaseOrderId: p.purchaseOrderId,
          totalAmount: p.totalAmount,
          createdDate: p.createDate,
        }));
        const customers: Customer[] = customersRes.data.data;
        const products: OrderDetail[] = productsRes.data.data;
        const orders: Order[] = ordersRes.data.data;

        // Generate month options for the last 5 years
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear() - 5, 0, 1);
        const months: string[] = [];
        let current = new Date(startDate);
        while (current <= currentDate) {
          months.push(`${current.getMonth() + 1}-${current.getFullYear()}`);
          current.setMonth(current.getMonth() + 1);
        }

        setMonthOptions(months);
        if (months.length > 0) {
          const defaultEndIndex = months.length - 1;
          const defaultStartIndex = Math.max(0, defaultEndIndex - 11);
          setStartMonth(months[defaultStartIndex]);
          setEndMonth(months[defaultEndIndex]);
        }

        setSuppliers(suppliers);
        setPurchaseData(purchases);
        setOrderData(orders);
        setCustomerData(customers);
        setProductData(products);
      } catch (err) {
        setError("Lỗi khi tải dữ liệu từ API!");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update overview statistics based on filtered data
  useEffect(() => {
    const filteredPurchases = filterByDateRange(purchaseData);
    const filteredOrders = filterByDateRange(orderData);
    setTotalPurchase(filteredPurchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0));
    setTotalRevenue(filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0));
    setOrderCount(filteredOrders.length);
  }, [purchaseData, orderData, startMonth, endMonth]);

  // Validate month range
  useEffect(() => {
    if (startMonth && endMonth) {
      const [startMonthNum, startYear] = startMonth.split("-").map(Number);
      const [endMonthNum, endYear] = endMonth.split("-").map(Number);
      const monthDiff = (endYear - startYear) * 12 + endMonthNum - startMonthNum + 1;

      if (monthDiff > 16) {
        setRangeError("Phạm vi tối đa là 16 tháng. Vui lòng chọn lại.");
      } else if (compareMonths(startMonth, endMonth) > 0) {
        setRangeError("Tháng bắt đầu phải sớm hơn hoặc bằng tháng kết thúc.");
      } else {
        setRangeError(null);
      }
    }
  }, [startMonth, endMonth]);

  // Handle month changes
  const handleStartMonthChange = (newStartMonth: string) => {
    setStartMonth(newStartMonth);
    if (endMonth && compareMonths(newStartMonth, endMonth) > 0) {
      setEndMonth(newStartMonth);
    }
  };

  const handleEndMonthChange = (newEndMonth: string) => {
    setEndMonth(newEndMonth);
    if (startMonth && compareMonths(startMonth, newEndMonth) > 0) {
      setStartMonth(newEndMonth);
    }
  };

  // Process monthly chart data
  const getMonthlyData = (data: (PurchaseOrder | Order)[]) => {
    if (!startMonth || !endMonth || rangeError) {
      return { months: ["Không có dữ liệu"], monthlyData: [0] };
    }

    const [startMonthNum, startYear] = startMonth.split("-").map(Number);
    const [endMonthNum, endYear] = endMonth.split("-").map(Number);
    const startDate = new Date(startYear, startMonthNum - 1);
    const endDate = new Date(endYear, endMonthNum - 1);

    const months: string[] = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      months.push(`${currentDate.getMonth() + 1}-${currentDate.getFullYear()}`);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    const monthlyData = months.map(month => {
      const [monthNum, year] = month.split("-").map(Number);
      const filteredData = data.filter(d => {
        if (!d.createdDate) return false;
        const date = new Date(d.createdDate);
        return (
          date.getMonth() + 1 === monthNum &&
          date.getFullYear() === year
        );
      });
      return filteredData.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
    });

    const displayMonths = months.map(m => {
      const [month, year] = m.split("-").map(Number);
      return `Tháng ${month} ${year}`;
    });

    return { months: displayMonths, monthlyData };
  };

  // Filter suppliers based on purchase orders' dates
  const filteredSuppliers = suppliers.map(supplier => {
    const relatedPurchases = filterByDateRange(purchaseData).filter(
      p => p.purchaseOrderId === supplier.supplierId // Adjust based on actual relationship
    );
    return {
      ...supplier,
      amountPaid: relatedPurchases.reduce((sum, p) => sum + p.totalAmount, 0),
    };
  }).filter(s => s.amountPaid > 0);

  // Filter customers based on orders' dates
  const filteredCustomers = customerData.map(customer => {
    const relatedOrders = filterByDateRange(orderData).filter(
      o => o.customerId === customer.customerId
    );
    return {
      ...customer,
      totalRevenue: relatedOrders.reduce((sum, o) => sum + o.totalAmount, 0),
    };
  }).filter(c => c.totalRevenue > 0);

  // Filter and aggregate products based on orders' dates
  const filteredOrders = filterByDateRange(orderData);
  const filteredProducts = aggregateOrderDetails(productData, filteredOrders).filter(
    p => p.totalQuantity > 0
  );

  // Chart Options and Series
  const purchaseChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "45%" } },
    title: { text: "Chi phí mua hàng", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: { categories: getMonthlyData(filterByDateRange(purchaseData)).months, labels: { rotate: -45 } },
    yaxis: {
      title: { text: "Số tiền (VND)" },
      labels: { formatter: (val: number) => val.toLocaleString("vi-VN") },
      min: 0,
      forceNiceScale: true,
    },
    colors: ["#EF4444"],
    tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("vi-VN")} VND` } },
    noData: { text: "Không có dữ liệu chi phí mua hàng" },
  };

  const purchaseChartSeries = [
    { name: "Mua hàng", data: getMonthlyData(filterByDateRange(purchaseData)).monthlyData },
  ];

  const salesChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { columnWidth: "45%" } },
    title: { text: "Doanh thu bán hàng", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: { categories: getMonthlyData(filterByDateRange(orderData)).months, labels: { rotate: -45 } },
    yaxis: {
      title: { text: "Số tiền (VND)" },
      labels: { formatter: (val: number) => val.toLocaleString("vi-VN") },
      min: 0,
      forceNiceScale: true,
    },
    colors: ["#3B82F6"],
    tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("vi-VN")} VND` } },
    noData: { text: "Không có dữ liệu doanh thu bán hàng" },
  };

  const salesChartSeries = [
    { name: "Bán hàng", data: getMonthlyData(filterByDateRange(orderData)).monthlyData },
  ];

  const productQuantityChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
    title: { text: "Sản phẩm bán chạy (Theo số lượng)", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: { categories: filteredProducts.map(p => p.product.productName), labels: { rotate: -45 } },
    yaxis: { title: { text: "Số lượng" }, min: 0 },
    colors: ["#10B981"],
    tooltip: { y: { formatter: val => `${val} đơn vị` } },
    noData: { text: "Không có dữ liệu sản phẩm" },
  };

  const productQuantityChartSeries = [
    { name: "Số Lượng", data: filteredProducts.map(p => p.totalQuantity) },
  ];

  const productRevenueChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
    title: { text: "Sản phẩm bán chạy (Theo doanh thu)", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: { categories: filteredProducts.map(p => p.product.productName), labels: { rotate: -45 } },
    yaxis: {
      title: { text: "Doanh thu (VND)" },
      labels: { formatter: (val: number) => val.toLocaleString("vi-VN") },
      min: 0,
      forceNiceScale: true,
    },
    colors: ["#3B82F6"],
    tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("vi-VN")} VND` } },
    noData: { text: "Không có dữ liệu sản phẩm" },
  };

  const productRevenueChartSeries = [
    { name: "Doanh thu", data: filteredProducts.map(p => p.totalQuantity * p.product.sellingPrice) },
  ];

  const supplierChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "55%" } },
    title: { text: "Số tiền đã thanh toán theo nhà cung cấp", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: {
      categories: filteredSuppliers.map(s => s.supplier?.supplierName || "Không xác định"),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "Số tiền (VND)" },
      labels: { formatter: (val: number) => val.toLocaleString("vi-VN") },
      min: 0,
      forceNiceScale: true,
    },
    colors: ["#F59E0B"],
    tooltip: { y: { formatter: (val: number) => `${val.toLocaleString("vi-VN")} VND` } },
    noData: { text: "Không có dữ liệu nhà cung cấp" },
  };

  const supplierChartSeries = [
    { name: "Số tiền thanh toán", data: filteredSuppliers.map(s => s.amountPaid || 0) },
  ];

  const customerChartOptions: ApexOptions = {
    chart: { type: "bar", height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: "45%", distributed: false } },
    title: { text: "Doanh thu & đơn hàng theo khách hàng", align: "left", style: { fontSize: "16px", color: "#111827" } },
    xaxis: {
      categories: filteredCustomers.map(c => `${c.customer.lastName}`),
      labels: { rotate: -45 },
    },
    yaxis: [
      {
        title: { text: "Doanh thu (VND)" },
        labels: { formatter: (val: number) => val.toLocaleString("vi-VN") },
        min: 0,
        forceNiceScale: true,
      },
      {
        opposite: true,
        title: { text: "Số đơn" },
        labels: { formatter: (val: number) => val.toFixed(0) },
        min: 0,
      },
    ],
    colors: ["#3B82F6", "#10B981"],
    legend: { position: "top" },
    tooltip: {
      y: [
        { formatter: (val: number) => `${val.toLocaleString("vi-VN")} VND` },
        { formatter: (val: number) => `${val} đơn` },
      ],
    },
    noData: { text: "Không có dữ liệu khách hàng" },
  };

  const customerChartSeries = [
    { name: "Doanh thu", type: "column", data: filteredCustomers.map(c => c.totalRevenue) },
    {
      name: "Số đơn",
      type: "column",
      data: filteredCustomers.map(c => filterByDateRange(orderData).filter(o => o.customerId === c.customerId).length),
    },
  ];

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Thống kê tài chính</h1>
          <p className="text-sm text-gray-600">Cập nhật: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>

        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Chọn khoảng thời gian</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Từ tháng</label>
              <select
                value={startMonth}
                onChange={e => handleStartMonthChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {monthOptions
                  .filter(month => !endMonth || compareMonths(month, endMonth) <= 0)
                  .map(month => (
                    <option key={month} value={month}>
                      Tháng {month.split("-")[0]} {month.split("-")[1]}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Đến tháng</label>
              <select
                value={endMonth}
                onChange={e => handleEndMonthChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                {monthOptions
                  .filter(month => !startMonth || compareMonths(month, startMonth) >= 0)
                  .map(month => (
                    <option key={month} value={month}>
                      Tháng {month.split("-")[0]} {month.split("-")[1]}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          {rangeError && <p className="mt-2 text-sm text-red-600">{rangeError}</p>}
        </div>

        {loading ? (
          <div className="text-center">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { icon: faMoneyBills, title: "Tổng doanh thu", value: `${(totalRevenue / 1000000).toFixed(1)}M VND`, color: "bg-blue-100 text-blue-600" },
              { icon: faBagShopping, title: "Tổng chi phí mua hàng", value: `${(totalPurchase / 1000000).toFixed(1)}M VND`, color: "bg-red-100 text-red-600" },
              { icon: faFileLines, title: "Số đơn hàng (Đã hoàn thành)", value: orderCount, color: "bg-green-100 text-green-600" },
            ].map((item, index) => (
              <div key={index} className={`bg-white p-4 rounded-lg shadow-sm flex items-center gap-4 ${item.color}`}>
                <div className="p-3 rounded-full bg-opacity-20">
                  <FontAwesomeIcon icon={item.icon} className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.title}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {rangeError ? (
              <div className="text-center text-gray-500">{rangeError}</div>
            ) : (
              <Chart options={purchaseChartOptions} series={purchaseChartSeries} type="bar" height={280} />
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {rangeError ? (
              <div className="text-center text-gray-500">{rangeError}</div>
            ) : (
              <Chart options={salesChartOptions} series={salesChartSeries} type="bar" height={280} />
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500">Không có dữ liệu sản phẩm</div>
            ) : (
              <Chart options={productQuantityChartOptions} series={productQuantityChartSeries} type="bar" height={280} />
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {filteredProducts.length === 0 ? (
              <div className="text-center text-gray-500">Không có dữ liệu sản phẩm</div>
            ) : (
              <Chart options={productRevenueChartOptions} series={productRevenueChartSeries} type="bar" height={280} />
            )}
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            {filteredSuppliers.length === 0 || filteredSuppliers.every(s => s.amountPaid === 0) ? (
              <div className="text-center text-gray-500">Không có dữ liệu nhà cung cấp</div>
            ) : (
              <Chart options={supplierChartOptions} series={supplierChartSeries} type="bar" height={280} />
            )}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          {filteredCustomers.length === 0 ? (
            <div className="text-center text-gray-500">Không có dữ liệu khách hàng</div>
          ) : (
            <Chart options={customerChartOptions} series={customerChartSeries} type="bar" height={280} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;