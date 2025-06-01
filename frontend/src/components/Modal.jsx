import React from "react";

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
      <div className="relative bg-gray-900 rounded-xl shadow-lg max-w-full" onClick={e => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-yellow-400 text-2xl font-bold focus:outline-none"
          onClick={onClose}
          aria-label="Kapat"
        >
          ×
        </button>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

export default Modal; 