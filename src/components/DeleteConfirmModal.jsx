import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function DeleteConfirmModal({ file, onConfirm, onClose, isDeleting }) {
  if (!file) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container delete-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="delete-icon-badge">
            <AlertTriangle size={24} className="text-rose" />
          </div>
          <div className="modal-title-col">
            <h3 className="modal-title">Delete S3 Object</h3>
            <span className="modal-subtitle">This action is permanent and cannot be undone</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="delete-warning-text">
            Are you sure you want to permanently delete the following object from AWS S3?
          </p>

          <div className="delete-file-summary">
            <div className="summary-row">
              <span className="summary-label">File Name:</span>
              <strong className="summary-value">{file.fileName}</strong>
            </div>
            <div className="summary-row">
              <span className="summary-label">S3 Key:</span>
              <code className="summary-value-code">{file.key}</code>
            </div>
            <div className="summary-row">
              <span className="summary-label">Object Size:</span>
              <span className="summary-value">{file.formattedSize}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-danger" 
            onClick={() => onConfirm(file)}
            disabled={isDeleting}
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting from S3...' : 'Yes, Delete Object'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
