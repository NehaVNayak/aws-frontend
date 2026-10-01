import React, { useState, useMemo } from 'react';
import { 
  Search, Grid, List as ListIcon, Filter, Download, Eye, Link, Trash2, 
  Copy, Check, FileText, Image as ImageIcon, Video, Music, Archive, 
  Code, File, ExternalLink, Calendar, HardDrive
} from 'lucide-react';

export default function FileList({ 
  files = [], 
  loading, 
  bucketName, 
  onPreview, 
  onPresignedUrl, 
  onDownload, 
  onDelete,
  onCopyS3Uri
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [sortBy, setSortBy] = useState('DATE_DESC');
  const [copiedKey, setCopiedKey] = useState(null);

  const getFileCategory = (fileName = '', contentType = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const type = (contentType || '').toLowerCase();

    if (type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) {
      return 'IMAGE';
    }
    if (type.startsWith('video/') || ['mp4', 'mov', 'webm', 'mkv', 'avi'].includes(ext)) {
      return 'VIDEO';
    }
    if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return 'AUDIO';
    }
    if (type.includes('pdf') || ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx'].includes(ext)) {
      return 'DOCUMENT';
    }
    if (type.includes('zip') || ['zip', 'tar', 'gz', '7z', 'rar'].includes(ext)) {
      return 'ARCHIVE';
    }
    if (['json', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'java', 'py', 'xml', 'yml', 'yaml', 'sql'].includes(ext)) {
      return 'CODE';
    }
    return 'OTHER';
  };

  const getFileIcon = (category) => {
    switch (category) {
      case 'IMAGE': return <ImageIcon className="file-type-icon text-cyan" size={20} />;
      case 'VIDEO': return <Video className="file-type-icon text-purple" size={20} />;
      case 'AUDIO': return <Music className="file-type-icon text-indigo" size={20} />;
      case 'DOCUMENT': return <FileText className="file-type-icon text-orange" size={20} />;
      case 'ARCHIVE': return <Archive className="file-type-icon text-amber" size={20} />;
      case 'CODE': return <Code className="file-type-icon text-emerald" size={20} />;
      default: return <File className="file-type-icon text-muted" size={20} />;
    }
  };

  const handleCopyKey = (key) => {
    const s3Uri = `s3://${bucketName || 'bucket'}/${key}`;
    navigator.clipboard.writeText(s3Uri);
    setCopiedKey(key);
    if (onCopyS3Uri) onCopyS3Uri(s3Uri);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Filter and sort items
  const filteredFiles = useMemo(() => {
    let result = files.filter(file => {
      const matchesSearch = file.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            file.fileName.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (categoryFilter === 'ALL') return true;
      const cat = getFileCategory(file.fileName, file.contentType);
      if (categoryFilter === 'IMAGE') return cat === 'IMAGE';
      if (categoryFilter === 'DOCUMENT') return cat === 'DOCUMENT';
      if (categoryFilter === 'MEDIA') return cat === 'VIDEO' || cat === 'AUDIO';
      if (categoryFilter === 'ARCHIVE') return cat === 'ARCHIVE';
      if (categoryFilter === 'CODE') return cat === 'CODE';
      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'DATE_DESC') {
        return new Date(b.lastModified || 0) - new Date(a.lastModified || 0);
      }
      if (sortBy === 'DATE_ASC') {
        return new Date(a.lastModified || 0) - new Date(b.lastModified || 0);
      }
      if (sortBy === 'NAME_ASC') {
        return a.fileName.localeCompare(b.fileName);
      }
      if (sortBy === 'SIZE_DESC') {
        return b.size - a.size;
      }
      return 0;
    });

    return result;
  }, [files, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="filelist-section">
      {/* Search, Filter & Layout Bar */}
      <div className="filelist-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input 
            id="input-search-files"
            type="text" 
            placeholder="Search files by name or folder..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        <div className="filter-group">
          {['ALL', 'IMAGE', 'DOCUMENT', 'MEDIA', 'ARCHIVE', 'CODE'].map(cat => (
            <button
              key={cat}
              className={`filter-pill ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="sort-view-group">
          <select 
            id="select-sort-files"
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="DATE_DESC">Newest First</option>
            <option value="DATE_ASC">Oldest First</option>
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="SIZE_DESC">Size (Largest)</option>
          </select>

          <div className="view-toggle">
            <button 
              id="btn-view-grid"
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <Grid size={18} />
            </button>
            <button 
              id="btn-view-table"
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Table View"
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Files Display */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Fetching files from AWS S3...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-wrapper">
            <HardDrive size={40} className="empty-icon" />
          </div>
          <h3>No S3 Objects Found</h3>
          <p>
            {searchTerm || categoryFilter !== 'ALL'
              ? 'No files matched your current search or filter criteria.'
              : 'Your S3 bucket is empty. Upload a file above to get started!'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="file-grid">
          {filteredFiles.map(file => {
            const category = getFileCategory(file.fileName, file.contentType);
            const isImage = category === 'IMAGE';

            return (
              <div key={file.key} className="file-card">
                <div className="file-card-preview" onClick={() => onPreview(file)}>
                  {isImage && file.presignedUrl ? (
                    <img 
                      src={file.presignedUrl} 
                      alt={file.fileName}
                      className="card-thumb-image"
                      loading="lazy"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="card-thumb-placeholder">
                      {getFileIcon(category)}
                    </div>
                  )}
                  <span className="file-badge-category">{category}</span>
                </div>

                <div className="file-card-body">
                  <h4 className="file-card-name" title={file.key}>
                    {file.fileName}
                  </h4>
                  {file.key !== file.fileName && (
                    <p className="file-card-path" title={file.key}>
                      {file.key}
                    </p>
                  )}

                  <div className="file-card-meta">
                    <span className="meta-size">{file.formattedSize}</span>
                    <span className="meta-date">{formatDate(file.lastModified)}</span>
                  </div>

                  <div className="file-card-actions">
                    <button 
                      className="action-btn"
                      onClick={() => onPreview(file)}
                      title="Preview File"
                    >
                      <Eye size={15} />
                    </button>

                    <button 
                      className="action-btn"
                      onClick={() => onPresignedUrl(file)}
                      title="Generate Presigned URL"
                    >
                      <Link size={15} />
                    </button>

                    <button 
                      className="action-btn"
                      onClick={() => onDownload(file)}
                      title="Download Direct"
                    >
                      <Download size={15} />
                    </button>

                    <button 
                      className="action-btn"
                      onClick={() => handleCopyKey(file.key)}
                      title="Copy s3:// URI"
                    >
                      {copiedKey === file.key ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
                    </button>

                    <button 
                      className="action-btn delete-btn"
                      onClick={() => onDelete(file)}
                      title="Delete from S3"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-wrapper">
          <table className="file-table">
            <thead>
              <tr>
                <th>Object Name / Key</th>
                <th>Category</th>
                <th>Size</th>
                <th>Last Modified</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.map(file => {
                const category = getFileCategory(file.fileName, file.contentType);

                return (
                  <tr key={file.key}>
                    <td className="table-cell-name">
                      <div className="table-name-wrapper">
                        {getFileIcon(category)}
                        <div className="table-name-col">
                          <span className="table-file-name" onClick={() => onPreview(file)}>
                            {file.fileName}
                          </span>
                          {file.key !== file.fileName && (
                            <span className="table-file-path">{file.key}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-cat-table">{category}</span>
                    </td>
                    <td className="table-cell-mono">{file.formattedSize}</td>
                    <td className="table-cell-date">{formatDate(file.lastModified)}</td>
                    <td className="text-right">
                      <div className="table-actions">
                        <button 
                          className="table-action-btn" 
                          onClick={() => onPreview(file)}
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button 
                          className="table-action-btn" 
                          onClick={() => onPresignedUrl(file)}
                          title="Presigned Link"
                        >
                          <Link size={15} />
                        </button>
                        <button 
                          className="table-action-btn" 
                          onClick={() => onDownload(file)}
                          title="Download"
                        >
                          <Download size={15} />
                        </button>
                        <button 
                          className="table-action-btn" 
                          onClick={() => handleCopyKey(file.key)}
                          title="Copy S3 URI"
                        >
                          {copiedKey === file.key ? <Check size={15} className="text-emerald" /> : <Copy size={15} />}
                        </button>
                        <button 
                          className="table-action-btn delete" 
                          onClick={() => onDelete(file)}
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
