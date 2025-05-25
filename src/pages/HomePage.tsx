import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom"; // Add useLocation
import Sidebar from "../components/global/Sidebar";
import ProductListPage from "./Home/ProductList";
import ProductAdd from "../components/Product/AddProduct";
import CategoryList from "./Home/CategoryList";
import CategoryAdd from "../components/Category/AddCategory";
import SubCategoryList from "./Home/SubCategoryList";
import SubAddCategory from "../components/Category/SubAddCategory";
import CustomerAdd from "../components/Customer/AddCustomer";
import CustomerListPage from "./Home/CustomerList";
import UserListPage from "./Home/UserList";
import UserAdd from "../components/User/AddUser";
import SupplierListPage from "./Home/SupplierList";
import SupplierAdd from "../components/Supplier/AddSupplier";
import PurchaseOrderListPage from "./Home/PurchaseOrderList";
import PurchaseOrderAdd from "../components/PurchaseOrder/AddPurchaseOrder";
import Navbar from "../components/global/Navbar";
import LotListPage from "./Home/LotList";
import ReceivedNoteListPage from "./Home/ReceivedNoteList";
import AddLot from "../components/Lot/AddLot";
import Dashboard from "./Dashboard/Dashboard/Dashboard";
import StorageRoomListPage from "./Home/StorageRoom";
import StorageRoomAdd from "../components/StorageRoom/AddStorageRoom";
import AddReceivedNote from "../components/ReceivedNote/AddReceivedNote";
import OrderListPage from "./Home/OrderList";
import NewOrder from "../components/Order/NewOrder";
import IssueNoteListPage from "./Home/IssueNoteList";
import UpdateProduct from "../components/Product/UpdateProduct";
import OrderListForSalesManager from "./Home/OrderListForSalesManager";
import OrderListForWarehouseManager from "./Home/OrderListForWarehouseManager";
import IssueNoteListPageForWarehouseManager from "./Home/IssueNoteListPageForWarehouseManager";
import NoteCheckListPage from "./Home/NoteCheckListPage";
import AddNoteCheck from "../components/NoteCheck/AddNoteCheck";
import { useAuth } from "./Home/AuthContext";
import AIindentification from "./AI/AIindentification"

const HomePage = () => {
  const { user } = useAuth();
  const location = useLocation(); // Add useLocation to access state
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      // Check if activePage is passed in location.state
      const pageFromState = location.state?.activePage;
      if (pageFromState) {
        setActivePage(pageFromState);
      } else {
        // Default page based on role
        if (user.roleName === "Customer") {
          setActivePage("Danh sách đơn hàng");
        } else if (user.roleName === "WarehouseManager") {
          setActivePage("Danh sách đơn hàng (Warehouse Manager)");
        } else {
          setActivePage("Dashboard");
        }
      }
    }
  }, [user, location.state]);

  const handleChangePage = (page: string, productId?: number) => {
    setActivePage(page);
    if (productId) {
      setSelectedProductId(productId);
    }
    // Clear location state to avoid stale state on subsequent navigations
    navigate('/home', { state: { activePage: page }, replace: true });
  };

  const handleAddNote = () => {
    setActivePage("Danh sách phiếu nhập");
  };

  console.log("📄 Trang hiện tại:", activePage);

  return (
    <div className="w-screen h-screen flex">
      <Sidebar activeSidebar={activePage} handleChangePage={handleChangePage} />
      <div className="flex-grow">
        <Navbar />
        {activePage === "Dashboard" && <Dashboard />}
        {activePage === "Danh sách sản phẩm" && <ProductListPage handleChangePage={handleChangePage} />}
        {activePage === "Chủng loại" && <CategoryList handleChangePage={handleChangePage} />}
        {activePage === "Tạo sản phẩm" && <ProductAdd handleChangePage={handleChangePage} />}
        {activePage === "Chỉnh sửa sản phẩm" && selectedProductId !== null && (
          <UpdateProduct productId={selectedProductId} handleChangePage={handleChangePage} />
        )}
        {activePage === "Tạo chủng loại" && <CategoryAdd handleChangePage={handleChangePage} />}
        {activePage === "Danh sách danh mục thuốc" && <SubCategoryList handleChangePage={handleChangePage} />}
        {activePage === "Tạo danh mục thuốc" && <SubAddCategory handleChangePage={handleChangePage} />}
        {activePage === "Danh sách nhà thuốc" && <CustomerListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo nhà thuốc" && <CustomerAdd />}
        {activePage === "Danh sách người dùng" && <UserListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo người dùng" && <UserAdd />}
        {activePage === "Danh sách nhà cung cấp" && <SupplierListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo nhà cung cấp" && <SupplierAdd />}
        {activePage === "Danh sách đơn đặt hàng(PO)" && <PurchaseOrderListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo đơn đặt hàng(PO)" && <PurchaseOrderAdd />}
        {activePage === "Danh sách lô hàng" && <LotListPage handleChangePage={setActivePage} />}
        {activePage === "Tạo lô hàng" && <AddLot handleChangePage={setActivePage} />}
        {activePage === "Danh sách phiếu nhập" && <ReceivedNoteListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo phiếu nhập kho" && (
          <AddReceivedNote handleChangePage={handleChangePage} handleAddNote={handleAddNote} />
        )}
        {activePage === "Danh sách kho" && <StorageRoomListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo kho mới" && <StorageRoomAdd />}
        {activePage === "Danh sách đơn hàng" && <OrderListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo đơn hàng" && <NewOrder />}
        {activePage === "Đơn hàng (Sales Manager)" && <OrderListForSalesManager handleChangePage={handleChangePage} />}
        {activePage === "Danh sách đơn hàng (Warehouse Manager)" && (
          <OrderListForWarehouseManager handleChangePage={handleChangePage} />
        )}
        {activePage === "Danh sách phiếu xuất kho" && <IssueNoteListPage handleChangePage={handleChangePage} />}
        {activePage === "Danh sách phiếu xuất kho (Warehouse Manager)" && (
          <IssueNoteListPageForWarehouseManager handleChangePage={handleChangePage} />
        )}
        {activePage === "Danh sách phiếu kiểm kê" && <NoteCheckListPage handleChangePage={handleChangePage} />}
        {activePage === "Tạo phiếu kiểm kê" && <AddNoteCheck handleChangePage={handleChangePage} />}
        {activePage === "Nhận diện thuốc" && <AIindentification handleChangePage={handleChangePage} />}
      </div>
    </div>
  );
};

export default HomePage;