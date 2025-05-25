import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmation({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Trigger animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${
        visible 
          ? "opacity-100 bg-black/30" 
          : "opacity-0 bg-black/0"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative bg-white rounded-xl shadow-xl w-full max-w-md transition-all duration-300 ease-out transform ${
          visible
            ? "translate-y-0 scale-100 opacity-100"
            : "-translate-y-12 scale-95 opacity-0"
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              xác nhận xóa
            </h2>
            <p className="text-gray-600">
              Bạn có chắc chắn muốn xóa sản phẩm này không? Hành động này không thể hoàn tác.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 cursor-pointer text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-2 cursor-pointer text-white bg-red-500 hover:bg-red-600 active:bg-red-700 rounded-lg transition-colors"
            >
              Delete 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}