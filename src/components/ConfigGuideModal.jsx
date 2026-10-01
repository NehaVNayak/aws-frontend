import React, { useState } from 'react';
import { X, Key, Copy, Check, RefreshCw, Shield, AlertCircle, CheckCircle2, Server } from 'lucide-react';
import { s3Api } from '../services/api';

export default function ConfigGuideModal({ status, onClose, onRefreshStatus, onShowToast }) {
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  const envTemplate = `# ==============================================
# AWS S3 Microservice Configuration (.env)
# ==============================================

# Your AWS IAM Access Key ID
AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID

# Your AWS IAM Secret Access Key
AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY

# AWS Region where your S3 bucket was created (e.g., us-east-1, us-west-2, ap-south-1)
AWS_REGION=us-east-1

# Your AWS S3 Bucket Name
AWS_S3_BUCKET_NAME=your-bucket-name

# (Optional) AWS Session Token if using temporary credentials
# AWS_SESSION_TOKEN=`;

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envTemplate);
    setCopied(true);
    onShowToast('.env template copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await onRefreshStatus();
      onShowToast('Connection check completed!', 'info');
    } catch (err) {
      onShowToast(`Connection check failed: ${err.message}`, 'error');
    } finally {
      setTesting(false);
    }
  };

  const isConnected = status && status.connected;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="config-icon-badge">
            <Key size={22} className="text-aws" />
          </div>
          <div className="modal-title-col">
            <h3 className="modal-title">AWS Credentials & .env Guide</h3>
            <span className="modal-subtitle">Quick instructions for editing your credentials</span>
          </div>
          <button className="btn-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Live Status Banner */}
          <div className={`config-status-card ${isConnected ? 'success' : 'pending'}`}>
            <div className="status-card-header">
              {isConnected ? (
                <CheckCircle2 size={20} className="text-emerald" />
              ) : (
                <AlertCircle size={20} className="text-amber" />
              )}
              <strong>
                {isConnected ? 'S3 Bucket Connected & Verified' : 'Configuration Required / Bucket Not Connected'}
              </strong>
            </div>
            <p className="status-card-msg">
              {status?.message || 'Update your .env file with your IAM credentials and bucket name, then click Test Connection.'}
            </p>
            {status?.bucketName && (
              <div className="status-card-props">
                <span><strong>Target Bucket:</strong> {status.bucketName}</span>
                <span><strong>Region:</strong> {status.region}</span>
                <span><strong>Auth Provider:</strong> {status.authType}</span>
              </div>
            )}
          </div>

          <div className="env-guide-steps">
            <h4>Simple 2-Step Setup:</h4>
            <ol className="steps-list">
              <li>
                Open the <code>.env</code> file in the project folder (or in <code>backend/.env</code>).
              </li>
              <li>
                Replace <code>YOUR_AWS_ACCESS_KEY_ID</code>, <code>YOUR_AWS_SECRET_ACCESS_KEY</code>, and <code>your-bucket-name</code> with your real AWS IAM credentials.
              </li>
            </ol>
          </div>

          <div className="env-code-wrapper">
            <div className="env-code-header">
              <span>File: <code>.env</code></span>
              <button 
                type="button" 
                className="btn-code-copy" 
                onClick={handleCopyEnv}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy Template'}</span>
              </button>
            </div>
            <pre className="env-code-block">{envTemplate}</pre>
          </div>

          <div className="iam-permissions-box">
            <div className="box-title">
              <Shield size={16} />
              <span>Recommended IAM Policy Permissions:</span>
            </div>
            <code>s3:PutObject, s3:GetObject, s3:ListBucket, s3:DeleteObject</code>
          </div>
        </div>

        <div className="modal-footer">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onClose}
          >
            Close
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleTestConnection}
            disabled={testing}
          >
            <RefreshCw size={16} className={testing ? 'animate-spin' : ''} />
            <span>{testing ? 'Testing Connection...' : 'Test Connection Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
