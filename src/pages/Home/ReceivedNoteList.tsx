import React, { useState, useEffect } from "react";
import axios from "axios";
import ReceivedNoteTable from "../../components/ReceivedNote/ReceivedNoteTable";
import { useAuth } from "../../pages/Home/AuthContext"; // Giả sử cần token để gọi API


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
      supplier: any | null;
    };
  }
interface ReceivedNoteListPageProps {
  handleChangePage: (page: string, noteId?: number) => void;
}

const ReceivedNoteListPage: React.FC<ReceivedNoteListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [filteredNotes, setFilteredNotes] = useState<ReceivedNote[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;


  // Gọi API để lấy danh sách phiếu nhập kho
  const fetchReceivedNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/ReceivedNote`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const notes = response.data.data.map((note: any) => ({
        receiveNoteId: note.receiveNoteId,
        receiveNotesCode: note.receiveNotesCode,
        purchaseOrderId: note.purchaseOrderId,
        status: note.status,
        createdBy: note.createdBy,
        createdDate: note.createdDate,
        createdByNavigation: note.createdByNavigation,
        purchaseOrder: note.purchaseOrder,
      }));
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu nhập kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReceivedNotes();
    }
  }, [user]);

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách phiếu nhập kho</h1>
          <p className="text-sm text-gray-500">Quản lý phiếu nhập kho</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        {loading ? (
          <div>Loading...</div> // Có thể thay bằng spinner
        ) : (
          <div id="printableArea">
            <ReceivedNoteTable
              notes={filteredNotes}
              handleChangePage={handleChangePage}
              onUpdate={(updatedNote) =>
                setFilteredNotes(
                  filteredNotes.map((note) =>
                    note.receiveNoteId === updatedNote.receiveNoteId ? updatedNote : note
                  )
                )
              }
              rowSelection={{
                selectedRowKeys,
                onChange: handleRowSelectionChange,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceivedNoteListPage;