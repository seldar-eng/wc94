
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-retro" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content-retro" onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title" className="text-2xl mb-3 text-cm-cyan border-b-2 border-cm-gray-light pb-2">{title}</h3>
        <div className="text-cm-cream text-base mb-4">{message}</div>
        <button 
            onClick={onClose} 
            className="btn-pm w-full"
            aria-label="Close modal"
            type="button"
        >
          <i className="fas fa-times-circle"></i>OK
        </button>
      </div>
    </div>
  );
};

export default Modal;