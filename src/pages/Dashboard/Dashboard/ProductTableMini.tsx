import React, { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";
import DeleteConfirmation from "../../../components/Confirm/DeleteConfirm";
// import ProductDetailsModal from "../../../components/Product/ProductDetail";

interface Product {
  id: number;
  ProductName: string;
  Price: number;
  image: string;
}

interface ProductTableProps {
  PRODUCTS_DATA_MINI: Product[];
  handleChangePage: (page: string, productId?: number) => void;
}

const ProductTable: React.FC<ProductTableProps> = ({ PRODUCTS_DATA_MINI}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 4 });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "id", // Ensure this field exists in your data
      header: "Mã sản phẩm",
    },
    {
      accessorKey: "ProductName",
      header: "Tên sản phẩm",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.image}
            alt={row.original.ProductName}
            className="w-10 h-10 rounded-lg object-cover bg-gray-100"
          />
          <span className="font-medium">{row.original.ProductName}</span>
        </div>
      ),
    },
    {
      accessorKey: "Price", // Make sure 'Price' matches your data field
      header: "Giá",
      cell: ({ row }) => <span>{row.original.Price.toLocaleString()} đ</span>, // Formatting price
    },
  ];

  const table = useReactTable({
    data: PRODUCTS_DATA_MINI,
    columns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getSortedRowModel: getSortedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      {/* Bảng dữ liệu */}
      <table className="w-full border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="bg-gray-50">
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-left text-sm font-bold">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : header.column.getIsSorted() === "desc" ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Phân trang
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-2 justify-end">
          <button
            className="px-3 py-1 text-sm rounded bg-gray-200"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }))}
            disabled={pagination.pageIndex === 0}
          >
            Trước
          </button>
          <span className="text-sm">
            Trang {pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <button
            className="px-3 py-1 text-sm rounded bg-gray-200"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: Math.min(prev.pageIndex + 1, table.getPageCount() - 1),
              }))
            }
            disabled={pagination.pageIndex >= table.getPageCount() - 1}
          >
            Tiếp
          </button>
        </div>
      </div> */}

      {/* Modals */}
      <DeleteConfirmation
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
      />
      {/* <ProductDetailsModal isOpen={isOpen} onClose={() => setIsOpen(false)} /> */}
    </div>
  );
};

export default ProductTable;
