const API_BASE = '/api/s3';

export const s3Api = {
  // Check bucket connectivity and status
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) {
      throw new Error(`Failed to check status (${res.status})`);
    }
    return res.json();
  },

  // List all files in the bucket, optionally with prefix
  async listFiles(prefix = '') {
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);

    const url = params.toString() ? `${API_BASE}/files?${params}` : `${API_BASE}/files`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to list files' }));
      throw new Error(err.error || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  // Upload file with optional prefix/folder
  async uploadFile(file, prefix = '', onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    if (prefix) formData.append('prefix', prefix);

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || `Upload failed with status ${res.status}`);
    }
    return res.json();
  },

  // Direct download URL
  getDownloadUrl(key) {
    return `${API_BASE}/download?key=${encodeURIComponent(key)}`;
  },

  // Direct inline view URL
  getViewUrl(key) {
    return `${API_BASE}/view?key=${encodeURIComponent(key)}`;
  },

  // Generate temporary presigned URL
  async getPresignedUrl(key, durationMinutes = 60) {
    const params = new URLSearchParams({
      key,
      durationMinutes: durationMinutes.toString()
    });
    const res = await fetch(`${API_BASE}/presigned-url?${params}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to get presigned URL' }));
      throw new Error(err.error || 'Failed to generate presigned URL');
    }
    return res.json();
  },

  // Delete object from S3
  async deleteFile(key) {
    const params = new URLSearchParams({ key });
    const res = await fetch(`${API_BASE}/files?${params}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete file' }));
      throw new Error(err.error || 'Failed to delete file');
    }
    return res.json();
  }
};
