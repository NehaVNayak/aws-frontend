import React from 'react';
import { Files, Database, Globe, Shield } from 'lucide-react';

export default function BucketStats({ status, fileCount, totalSizeFormatted }) {
  const bucketName = status?.bucketName || 'Not Set';
  const region = status?.region || 'us-east-1';
  const authType = status?.authType || 'IAM User Key';
  const isConnected = status?.connected;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon-wrapper files">
          <Files size={22} />
        </div>
        <div className="stat-details">
          <span className="stat-title">Total Objects</span>
          <h3 className="stat-value">{fileCount !== undefined ? fileCount : (status?.objectCount || 0)}</h3>
          <span className="stat-sub">S3 bucket files</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper storage">
          <Database size={22} />
        </div>
        <div className="stat-details">
          <span className="stat-title">Storage Used</span>
          <h3 className="stat-value">{totalSizeFormatted || status?.formattedTotalSize || '0 B'}</h3>
          <span className="stat-sub">Active consumption</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper bucket">
          <Globe size={22} />
        </div>
        <div className="stat-details">
          <span className="stat-title">Target Bucket</span>
          <h3 className="stat-value text-truncate" title={bucketName}>{bucketName}</h3>
          <span className="stat-sub">AWS S3 Identifier</span>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon-wrapper region">
          <Shield size={22} />
        </div>
        <div className="stat-details">
          <span className="stat-title">Region & Auth</span>
          <h3 className="stat-value">{region}</h3>
          <span className="stat-sub text-truncate" title={authType}>{isConnected ? 'Active & Authenticated' : 'Pending Verification'}</span>
        </div>
      </div>
    </div>
  );
}
