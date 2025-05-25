import React, { useState } from "react";
import LotTable from "../../components/Lot/LotTable";
import { useAuth } from '../Home/AuthContext';

// interface ProductLot {
//   id: number;
//   lotId: number;
//   productId: number;
//   quantity: number;
//   manufacturedDate: string;
//   expiredDate: string;
//   supplyPrice: number;
//   status: number | null;
//   productName: string;
//   lotCode: string;
// }

interface LotListPageProps {
  handleChangePage: (page: string, lotId?: number) => void;
}

const LotListPage: React.FC<LotListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  // Hàm xử lý khi xóa lô (có thể gọi API DELETE nếu cần)
  const handleDelete = (id: number) => {
    console.log("Xóa lô:", id);
    // Gọi API DELETE nếu có: axios.delete(`https://pharmadistiprobe.fun/api/ProductLot/${id}`);
  };

  if (!user) {
    return (
      <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
        <div className="text-red-500">Vui lòng đăng nhập để xem danh sách lô hàng.</div>
      </div>
    );
  }

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách lô hàng</h1>
          <p className="text-sm text-gray-500">Quản lý lô hàng</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div id="printableArea">
          <LotTable
            handleChangePage={handleChangePage}
            onDelete={handleDelete}
            // onUpdate={handleUpdate}
            rowSelection={{
              selectedRowKeys,
              onChange: handleRowSelectionChange,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default LotListPage;