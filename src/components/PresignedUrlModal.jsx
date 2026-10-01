import React, { useState, useEffect } from 'react';
import { X, Link, Copy, Check, ExternalLink, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { s3Api } from '../services/api';

export default function PresignedUrlModal({ file, onClose, onShowToast }) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [presignedUrl, setPresignedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (file) {
      generateUrl(durationMinutes);
    }
  }, [file, durationMinutes]);

  const generateUrl = async (minutes) => {
    setLoading(true);
    try {
      const data = await s3Api.getPresignedUrl(file.key, minutes);
      setPresignedUrl(data.url);
    } catch (err) {
      onShowToast(`Failed to generate URL: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!presignedUrl) return;
    navigator.clipboard.writeText(presignedUrl);
    setCopied(true);
    onShowToast('Presigned URL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  if (!file) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container presigned-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-col">
            <h3 className="modal-title">AWS S3 Presigned URL</h3>
            <span className="modal-subtitle">Secure temporary access link for "{file.fileName}"</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="presigned-info-box">
            <ShieldCheck size={20} className="text-emerald" />
            <p>
              Presigned URLs grant temporary read access directly through AWS S3 without exposing your IAM credentials.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              <Clock size={16} />
              <span>Link Expiration Duration:</span>
            </label>
            <div className="duration-buttons">
              {[
                { label: '15 min', val: 15 },
                { label: '1 hour', val: 60 },
                { label: '6 hours', val: 360 },
                { label: '24 hours', val: 1440 },
                { label: '7 days', val: 10080 },
              ].map(d => (
                <button
                  key={d.val}
                  type="button"
                  className={`duration-btn ${durationMinutes === d.val ? 'active' : ''}`}
                  onClick={() => setDurationMinutes(d.val)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Generated Temporary URL:</label>
            <div className="url-copy-container">
              {loading ? (
                <div className="url-loading">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing URL via AWS S3 SDK...</span>
                </div>
              ) : (
                <textarea 
                  className="url-textarea"
                  value={presignedUrl} 
                  readOnly 
                  rows={4}
                  onClick={(e) => e.target.select()}
                />
              )}
            </div>
          </div>

          <div className="presigned-modal-actions">
            <button 
              className="btn-primary" 
              onClick={handleCopy}
              disabled={loading || !presignedUrl}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Presigned URL'}</span>
            </button>

            {presignedUrl && (
              <a 
                href={presignedUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn-secondary"
              >
                <ExternalLink size={18} />
                <span>Test in New Tab</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
