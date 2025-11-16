// src/components/ConfirmModal.tsx
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const typeColors = {
    danger: {
      bg: 'from-red-500 to-red-600',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-600'
    },
    warning: {
      bg: 'from-yellow-500 to-orange-600',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'text-yellow-600'
    },
    info: {
      bg: 'from-blue-500 to-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'text-blue-600'
    }
  };

  const colors = typeColors[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          {/* Ícone */}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {type === 'danger' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
              {type === 'warning' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              )}
              {type === 'info' && (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>

          {/* Título */}
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
            {title}
          </h3>

          {/* Mensagem */}
          <p className="text-gray-600 text-center mb-6">
            {message}
          </p>

          {/* Botões */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-3 ${colors.button} text-white rounded-xl transition-colors font-medium shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
