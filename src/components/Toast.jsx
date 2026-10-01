import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { message, type = 'info' } = toast;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-emerald" />;
      case 'error': return <AlertCircle size={18} className="text-rose" />;
      default: return <Info size={18} className="text-cyan" />;
    }
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">{getIcon()}</div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
}
