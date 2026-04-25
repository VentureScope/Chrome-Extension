import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../../state/store";

export function SettingsPage() {
  const navigate = useNavigate();
  const autoSyncToggle = useAppStore((s) => s.autoSyncToggle);
  const notificationsToggle = useAppStore((s) => s.notificationsToggle);
  const requireStudentIdToggle = useAppStore((s) => s.requireStudentIdToggle);
  const setSettings = useAppStore((s) => s.setSettings);
  const setSyncedData = useAppStore((s) => s.setSyncedData);

  async function clearCache() {
    if (!confirm("This will clear all cached academic data. Continue?")) return;
    await setSyncedData(null);
    alert("Cache cleared successfully");
  }

  return (
    <div className="screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            />
          </svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}>
          Settings
        </h2>
      </div>

      <div className="settings-container">
        <div className="setting-item">
          <div className="setting-info">
            <h3>Auto-sync</h3>
            <p>Automatically sync when portal is detected</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoSyncToggle}
              onChange={(e) => setSettings({ autoSyncToggle: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h3>Notifications</h3>
            <p>Get notified when sync is complete</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={notificationsToggle}
              onChange={(e) => setSettings({ notificationsToggle: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h3>Require Student ID</h3>
            <p>Block sync until Student ID is filled in dashboard</p>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={requireStudentIdToggle}
              onChange={(e) => setSettings({ requireStudentIdToggle: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <h3>Clear Cache</h3>
            <p>Remove all locally stored academic data</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={clearCache}>
            Clear Cache
          </button>
        </div>
      </div>
    </div>
  );
}

