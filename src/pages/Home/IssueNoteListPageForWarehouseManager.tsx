import React, { useState, useEffect } from "react";
import axios from "axios";
import IssueNoteTable from "../../components/IssueNote/IssueNoteTable"; // Điều chỉnh đường dẫn
import { useAuth } from "../Home/AuthContext"; // Điều chỉnh đường dẫn

interface IssueNoteListPageProps {
  handleChangePage: (page: string, noteId?: number) => void;
}

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

const IssueNoteListPageForWarehouseManager: React.FC<IssueNoteListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [filteredNotes, setFilteredNotes] = useState<IssueNote[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const fetchIssueNotesByWarehouse = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      if (user?.roleName !== "WarehouseManager") {
        console.log("Không có quyền truy cập. Vai trò yêu cầu: WarehouseManager");
        setFilteredNotes([]);
        return;
      }

      const response = await axios.get(
        `${API_BASE_URL}/IssueNote/GetIssueNoteListByWarehouse`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const notes = response.data.data.map((note: any) => ({
        id: note.issueNoteId,
        issueNoteCode: note.issueNoteCode,
        orderId: note.orderId,
        customerId: note.customerId,
        updatedStatusDate: new Date(note.updatedStatusDate),
        totalAmount: note.totalAmount,
        createdBy: note.createdBy,
        createdDate: new Date(note.createdDate),
        status: note.status,
      }));
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu xuất kho theo kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIssueNotesByWarehouse();
    }
  }, [user]);

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách phiếu xuất kho (Warehouse Manager)</h1>
          <p className="text-sm text-gray-500">Quản lý phiếu xuất kho của kho bạn quản lý</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        {user?.roleName === "WarehouseManager" ? (
          loading ? (
            <p>Đang tải danh sách phiếu xuất kho...</p>
          ) : (
            <div id="printableArea">
              <IssueNoteTable
                notes={filteredNotes}
                handleChangePage={handleChangePage}
                // onDelete={(id) => setFilteredNotes(filteredNotes.filter((note) => note.id !== id))}
                onUpdate={(updatedNote) =>
                  setFilteredNotes(
                    filteredNotes.map((note) => (note.id === updatedNote.id ? updatedNote : note))
                  )
                }
                rowSelection={{
                  selectedRowKeys,
                  onChange: handleRowSelectionChange,
                }}
              />
            </div>
          )
        ) : (
          <p className="text-red-500">
            Bạn không có quyền truy cập danh sách này. Vai trò yêu cầu: Warehouse Manager.
          </p>
        )}
      </div>
    </div>
  );
};

export default IssueNoteListPageForWarehouseManager;