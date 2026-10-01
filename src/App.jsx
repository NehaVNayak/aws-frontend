import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import BucketStats from './components/BucketStats';
import UploadZone from './components/UploadZone';
import FileList from './components/FileList';
import PreviewModal from './components/PreviewModal';
import PresignedUrlModal from './components/PresignedUrlModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';
import ConfigGuideModal from './components/ConfigGuideModal';
import Toast from './components/Toast';
import { s3Api } from './services/api';
import './App.css';

export default function App() {
  const [status, setStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modals state
  const [previewFile, setPreviewFile] = useState(null);
  const [presignedFile, setPresignedFile] = useState(null);
  const [deleteTargetFile, setDeleteTargetFile] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Toast state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const closeToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch bucket connectivity status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await s3Api.getStatus();
      setStatus(data);
      return data;
    } catch (err) {
      console.warn('Could not retrieve S3 status from backend:', err);
      const fallback = {
        configured: false,
        connected: false,
        bucketName: '',
        region: 'us-east-1',
        message: 'Backend microservice unreachable or starting up.'
      };
      setStatus(fallback);
      return fallback;
    }
  }, []);

  // Fetch file list
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await s3Api.listFiles();
      // If data is array
      if (Array.isArray(data)) {
        setFiles(data);
      } else if (data && data.items) {
        setFiles(data.items);
      } else {
        setFiles([]);
      }
    } catch (err) {
      console.error('Error fetching files:', err);
      // We don't flood toast on initial load if bucket is not configured
    } finally {
      setLoading(false);
    }
  }, []);

  // Load everything on initial render
  const refreshAll = useCallback(async () => {
    const statusData = await fetchStatus();
    if (statusData && statusData.connected) {
      await fetchFiles();
    } else {
      setLoading(false);
      setFiles([]);
    }
  }, [fetchStatus, fetchFiles]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle file upload
  const handleUpload = async (file, prefix) => {
    setUploading(true);
    try {
      const res = await s3Api.uploadFile(file, prefix);
      showToast(`Uploaded "${res.fileName || file.name}" successfully!`, 'success');
      // Refresh list & status
      await fetchFiles();
      await fetchStatus();
    } catch (err) {
      showToast(`Upload failed: ${err.message}`, 'error');
      throw err;
    } finally {
      setUploading(false);
    }
  };

  // Handle file delete
  const handleDeleteConfirm = async (file) => {
    if (!file) return;
    setDeleting(true);
    try {
      await s3Api.deleteFile(file.key);
      showToast(`Deleted "${file.fileName}" from S3`, 'success');
      setDeleteTargetFile(null);
      // Refresh list & stats
      await fetchFiles();
      await fetchStatus();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Handle direct file download
  const handleDownload = (file) => {
    const downloadUrl = s3Api.getDownloadUrl(file.key);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading "${file.fileName}"...`, 'info');
  };

  // Total size calculated from loaded files or status
  const totalSizeBytes = files.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const formatBytes = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    const exp = Math.floor(Math.log(bytes) / Math.log(1024));
    const pre = 'KMGTPE'.charAt(exp - 1);
    return (bytes / Math.pow(1024, exp)).toFixed(2) + ' ' + pre + 'B';
  };

  return (
    <div className="app-layout">
      {/* Top Header */}
      <Header 
        status={status}
        loading={loading}
        onRefresh={refreshAll}
        onOpenConfig={() => setShowConfigModal(true)}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <div className="container">
          {/* Quick Notice if bucket is not connected yet */}
          {status && !status.connected && (
            <div className="alert-banner">
              <div className="alert-banner-content">
                <span className="alert-icon">⚡</span>
                <div className="alert-text">
                  <strong>AWS IAM Setup Needed:</strong>{' '}
                  {status.message || 'Please configure your AWS IAM credentials and bucket name in the .env file.'}
                </div>
              </div>
              <button 
                id="btn-banner-open-guide"
                className="btn-banner-action" 
                onClick={() => setShowConfigModal(true)}
              >
                Open .env Setup Guide
              </button>
            </div>
          )}

          {/* Metric Stats Cards */}
          <BucketStats 
            status={status} 
            fileCount={files.length}
            totalSizeFormatted={formatBytes(totalSizeBytes)}
          />

          {/* Drag & Drop Upload Zone */}
          <UploadZone 
            onUpload={handleUpload}
            isUploading={uploading}
            isConnected={status?.connected}
          />

          {/* File Browser & Action Grid */}
          <FileList 
            files={files}
            loading={loading}
            bucketName={status?.bucketName}
            onPreview={(file) => setPreviewFile(file)}
            onPresignedUrl={(file) => setPresignedFile(file)}
            onDownload={handleDownload}
            onDelete={(file) => setDeleteTargetFile(file)}
            onCopyS3Uri={(uri) => showToast(`Copied S3 URI: ${uri}`, 'success')}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="container footer-content">
          <p>AWS S3 Microservice • Spring Boot 3 Java & React</p>
          <p className="footer-links">
            <span onClick={() => setShowConfigModal(true)} className="footer-link">
              .env Credentials
            </span>
            <span>•</span>
            <span>ECR & EC2 Ready</span>
          </p>
        </div>
      </footer>

      {/* Modals */}
      {previewFile && (
        <PreviewModal 
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {presignedFile && (
        <PresignedUrlModal 
          file={presignedFile}
          onClose={() => setPresignedFile(null)}
          onShowToast={showToast}
        />
      )}

      {deleteTargetFile && (
        <DeleteConfirmModal 
          file={deleteTargetFile}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTargetFile(null)}
          isDeleting={deleting}
        />
      )}

      {showConfigModal && (
        <ConfigGuideModal 
          status={status}
          onClose={() => setShowConfigModal(false)}
          onRefreshStatus={refreshAll}
          onShowToast={showToast}
        />
      )}

      {/* Floating Notifications */}
      <Toast toast={toast} onClose={closeToast} />
    </div>
  );
}
