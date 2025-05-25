import React from "react";

interface ToastProps {
    message: string;
    isOpen: boolean;
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="w-96 p-6 text-white bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105">
                <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">{message}</span>
                    <button onClick={onClose} className="text-white text-2xl">
                        &times;
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;