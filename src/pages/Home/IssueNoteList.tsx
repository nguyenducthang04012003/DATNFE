import React, { useState, useEffect } from "react";
import axios from "axios";
import IssueNoteTable from "../../components/IssueNote/IssueNoteTable";
import { useAuth } from "../../pages/Home/AuthContext"; // Giả sử cần token để gọi API

interface IssueNoteListPageProps {
  handleChangePage: (page: string, noteId?: number) => void;
}

interface IssueNote {
  id: number; // Thay issueNoteId thành id để đồng nhất với IssueNoteTable
  issueNoteCode: string;
  orderId: number;
  customerId: number;
  updatedStatusDate: Date;
  totalAmount: number;
  createdBy: number; // API trả số, không phải string
  createdDate: Date;
  status: number; // API trả số (0, 2, ...)
}

const IssueNoteListPage: React.FC<IssueNoteListPageProps> = ({ handleChangePage }) => {
  const { user } = useAuth();
  const [filteredNotes, setFilteredNotes] = useState<IssueNote[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [loading , setLoading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Gọi API để lấy danh sách phiếu xuất kho
  const fetchIssueNotes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${API_BASE_URL}/IssueNote/GetIssueNoteList`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Chuyển đổi dữ liệu từ API để khớp với interface
      const notes = response.data.data.map((note: any) => ({
        id: note.issueNoteId,
        issueNoteCode: note.issueNoteCode,
        orderId: note.orderId,
        customerId: note.customerId,
        updatedStatusDate: new Date(note.updatedStatusDate),
        totalAmount: note.totalAmount,
        createdBy: note.createdBy, // Giữ nguyên số
        createdDate: new Date(note.createdDate),
        status: note.status, // Giữ nguyên số
      }));
      setFilteredNotes(notes);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách phiếu xuất kho:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchIssueNotes();
    }
  }, [user]);

  const handleRowSelectionChange = (selectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(selectedRowKeys as number[]);
  };

  return (
    <div className="p-6 mt-[60px] overflow-auto w-full bg-[#fafbfe]">
      <div className="flex justify-between items-center mb-[25px]">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Danh sách phiếu xuất kho</h1>
          <p className="text-sm text-gray-500">Quản lý phiếu xuất kho</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
      {loading ? (
        <div>Loading...</div> // You can replace this with a spinner or better UI
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
      )}
    </div>
    </div>
  );
};

export default IssueNoteListPage;