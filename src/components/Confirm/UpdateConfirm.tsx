import React from 'react';
import { X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <button className="absolute top-2 right-2" onClick={onClose}>
          <X />
        </button>
        <h2 className="text-lg font-semibold">{message}</h2>
        <div className="flex justify-end mt-4">
          <button className="mr-2 border rounded p-2" onClick={onClose}>Hủy</button>
          <button className="bg-blue-500 text-white rounded p-2" onClick={onConfirm}>Xác nhận</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;