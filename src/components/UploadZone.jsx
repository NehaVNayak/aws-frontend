import React, { useState, useRef } from 'react';
import { UploadCloud, Folder, File, X, Check, ArrowUpRight, Loader2 } from 'lucide-react';

export default function UploadZone({ onUpload, isUploading, isConnected }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [prefix, setPrefix] = useState('');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    try {
      await onUpload(selectedFile, prefix);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      // Error handled by parent toast
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    const pre = 'KMGTPE'.charAt(exp - 1);
    return (bytes / Math.pow(1024, exp)).toFixed(2) + ' ' + pre + 'B';
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h2 className="section-title">Upload Objects to S3</h2>
        <span className="upload-badge">Microservice API</span>
      </div>

      <div 
        className={`dropzone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input 
          id="file-upload-input"
          ref={fileInputRef}
          type="file" 
          className="hidden-file-input" 
          onChange={handleFileChange}
        />

        {!selectedFile ? (
          <div className="dropzone-content">
            <div className="dropzone-icon-container">
              <UploadCloud className="dropzone-icon" size={36} />
            </div>
            <div className="dropzone-text">
              <p className="dropzone-main-text">
                <strong>Click to browse</strong> or drag & drop files here
              </p>
              <p className="dropzone-sub-text">
                Supports all file formats (Images, PDFs, Videos, Datasets, Archives) up to 100MB
              </p>
            </div>
          </div>
        ) : (
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-info">
              <div className="file-icon-badge">
                <File size={24} />
              </div>
              <div className="file-preview-details">
                <p className="file-name" title={selectedFile.name}>{selectedFile.name}</p>
                <p className="file-meta">
                  <span>{formatFileSize(selectedFile.size)}</span> • 
                  <span>{selectedFile.type || 'Binary / Data'}</span>
                </p>
              </div>
            </div>
            <button 
              id="btn-remove-selected-file"
              type="button" 
              className="btn-icon-danger"
              onClick={clearSelectedFile}
              title="Remove file"
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="upload-controls-row">
        <div className="prefix-input-group">
          <Folder size={18} className="input-icon" />
          <input 
            id="input-s3-prefix"
            type="text" 
            placeholder="Target folder / prefix (e.g. uploads/ or documents/)" 
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            className="prefix-input"
            disabled={isUploading}
          />
        </div>

        <button 
          id="btn-submit-upload"
          className="btn-primary"
          onClick={handleUploadSubmit}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Uploading to S3...</span>
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              <span>Upload to S3</span>
            </>
          )}
        </button>
      </div>

      {!isConnected && (
        <div className="upload-notice">
          <span className="notice-icon">💡</span>
          <span>Ensure your AWS credentials and bucket name are configured in <code>.env</code> before uploading.</span>
        </div>
      )}
    </div>
  );
}
