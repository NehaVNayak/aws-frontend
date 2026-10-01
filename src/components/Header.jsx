import React from 'react';
import { Cloud, RefreshCw, Key, ShieldCheck, AlertTriangle, CheckCircle2, Server } from 'lucide-react';

export default function Header({ status, loading, onRefresh, onOpenConfig }) {
  const isConnected = status && status.connected;
  const isConfigured = status && status.configured;

  return (
    <header className="header-container">
      <div className="header-content">
        <div className="brand-section">
          <div className="brand-logo">
            <Cloud className="brand-icon" size={28} />
            <div className="brand-glow"></div>
          </div>
          <div>
            <div className="brand-title-row">
              <h1 className="brand-title">CloudVault</h1>
              <span className="badge-service">
                <Server size={12} />
                Java Microservice
              </span>
            </div>
            <p className="brand-subtitle">High-Performance AWS S3 Object Storage Console</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Live S3 Connection Status Pill */}
          <div className={`status-pill ${isConnected ? 'connected' : isConfigured ? 'warning' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <div className="status-text-group">
              <span className="status-label">
                {isConnected ? 'S3 Bucket Connected' : isConfigured ? 'Connection Issue' : 'Bucket Not Configured'}
              </span>
              {isConnected && status.bucketName && (
                <span className="status-bucket">{status.bucketName} ({status.region})</span>
              )}
            </div>
          </div>

          {/* Quick Config Button */}
          <button 
            id="btn-env-config"
            className="btn-secondary" 
            onClick={onOpenConfig}
            title="View .env Configuration & Setup Guide"
          >
            <Key size={16} />
            <span>.env Config</span>
          </button>

          {/* Refresh Data Button */}
          <button 
            id="btn-refresh"
            className={`btn-icon ${loading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Refresh Files & Status"
            disabled={loading}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
