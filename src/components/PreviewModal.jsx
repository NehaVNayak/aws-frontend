import React from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, Music, Video, File } from 'lucide-react';
import { s3Api } from '../services/api';

export default function PreviewModal({ file, onClose }) {
  if (!file) return null;

  const viewUrl = file.presignedUrl || s3Api.getViewUrl(file.key);
  const downloadUrl = s3Api.getDownloadUrl(file.key);
  const ext = file.fileName.split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext) || file.contentType?.startsWith('image/');
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext) || file.contentType?.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg'].includes(ext) || file.contentType?.startsWith('audio/');
  const isPdf = ext === 'pdf' || file.contentType === 'application/pdf';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-col">
            <h3 className="modal-title" title={file.fileName}>{file.fileName}</h3>
            <span className="modal-subtitle">{file.key} • {file.formattedSize}</span>
          </div>
          <div className="modal-header-actions">
            <a 
              href={downloadUrl} 
              download 
              className="btn-modal-action"
              title="Download File"
            >
              <Download size={16} />
              <span>Download</span>
            </a>
            <a 
              href={viewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-modal-action"
              title="Open Raw in New Tab"
            >
              <ExternalLink size={16} />
              <span>Open Tab</span>
            </a>
            <button className="btn-modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body preview-body">
          {isImage ? (
            <div className="preview-image-wrapper">
              <img src={viewUrl} alt={file.fileName} className="preview-image" />
            </div>
          ) : isVideo ? (
            <div className="preview-media-wrapper">
              <video controls src={viewUrl} className="preview-video" autoPlay>
                Your browser does not support the video tag.
              </video>
            </div>
          ) : isAudio ? (
            <div className="preview-media-wrapper audio-wrapper">
              <audio controls src={viewUrl} className="preview-audio" autoPlay>
                Your browser does not support the audio element.
              </audio>
            </div>
          ) : isPdf ? (
            <iframe 
              src={viewUrl} 
              title={file.fileName} 
              className="preview-iframe"
            />
          ) : (
            <div className="preview-fallback">
              <File size={56} className="fallback-icon" />
              <h4>Preview Not Supported for this File Type</h4>
              <p>This file type ({file.contentType || ext}) can be downloaded or opened directly.</p>
              <a href={downloadUrl} download className="btn-primary" style={{ marginTop: '16px' }}>
                <Download size={16} />
                Download {file.fileName}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
