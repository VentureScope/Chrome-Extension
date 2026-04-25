import React from "react";

// NOTE: IDs/classnames intentionally match the previous `popup.html` + `popup.js`.
export function PopupShell() {
  return (
    <div className="container">
      {/* Login Screen */}
      <div id="loginScreen" className="screen">
        <div className="header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0066ff" />
              <path d="M16 8L22 16L16 24L10 16L16 8Z" fill="white" />
            </svg>
            <h1>VentureScope</h1>
          </div>
          <p className="subtitle">Sign in to sync your academic data</p>
        </div>

        <form id="loginForm" className="form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" id="loginBtn">
            <span>Sign In</span>
          </button>

          <p className="help-text">Use your VentureScope account credentials</p>
        </form>
      </div>

      {/* Dashboard Screen */}
      <div id="dashboardScreen" className="screen hidden">
        <div className="header">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#0066ff" />
              <path d="M16 8L22 16L16 24L10 16L16 8Z" fill="white" />
            </svg>
            <h1>VentureScope</h1>
          </div>
        </div>

        <div className="status-badge">
          <span className="status-badge-dot"></span>
          ACTIVE ENVIRONMENT
        </div>

        <div className="status-card">
          <h2 className="status-card-title">Ready to Sync</h2>
          <p className="status-card-description">
            Securely migrate your academic record to the intelligence layer.
          </p>
        </div>

        <div className="form-group">
          <label htmlFor="manualStudentIdInput">
            Student ID (optional override)
          </label>
          <input
            type="text"
            id="manualStudentIdInput"
            placeholder="Enter Student ID for upload payload"
          />
        </div>

        <button className="btn btn-primary" id="syncBtn">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
          </svg>
          <span>Sync Academic Data</span>
        </button>

        <div className="quick-actions">
          <button className="btn btn-secondary" id="openDataBtn">
            View Synced Data
          </button>
          <button className="btn btn-secondary" id="openTranscriptConfigBtn">
            Transcript Config
          </button>
          <button className="btn btn-secondary" id="openSettingsBtn">
            Settings
          </button>
        </div>

        <div className="sync-activity">
          <div className="sync-activity-header">
            <h3>Sync Activity</h3>
            <span className="sync-activity-label" id="liveLabel">
              Live Feed
            </span>
          </div>
          <div className="activity-list" id="activityList">
            <p className="empty-state">No sync activity yet.</p>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 20,
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="avatar"
              style={{ width: 36, height: 36, fontSize: 14 }}
            >
              <span id="userInitials">U</span>
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#0f172a",
                }}
                id="userName"
              >
                User
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }} id="userEmail">
                user@email.com
              </div>
            </div>
          </div>
          <button className="btn-icon" id="logoutBtn" title="Logout">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 11-2 0V4H5v12h10v-2a1 1 0 112 0v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Data View Screen */}
      <div id="dataScreen" className="screen hidden">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button className="btn-back" id="backFromData">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              />
            </svg>
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}>
            Synced Academic Data
          </h2>
        </div>

        <div className="data-container" id="dataContainer">
          <div className="data-section">
            <h3>Personal Information</h3>
            <div className="data-grid" id="personalData"></div>
          </div>

          <div className="data-section">
            <h3>Courses & Grades</h3>
            <div id="coursesData"></div>
          </div>

          <div className="data-section">
            <h3>Academic Progress</h3>
            <div className="data-grid" id="progressData"></div>
          </div>
        </div>
      </div>

      {/* Transcript Config Screen */}
      <div id="transcriptConfigScreen" className="screen hidden">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <button className="btn-back" id="backFromTranscriptConfig">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              />
            </svg>
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}>
            Transcript Config
          </h2>
        </div>

        <p className="subtitle" style={{ marginTop: -8 }}>
          Configure grading scale and schema used for transcript uploads.
        </p>

        <div className="config-status" id="transcriptConfigStatus">
          No changes yet.
        </div>

        <div className="settings-container">
          <div className="setting-item config-field config-field-column">
            <div className="setting-info">
              <h3>GPA Scale</h3>
              <p>Examples: 4.0, 5.0, 10.0, 100.0</p>
            </div>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              id="gpaScaleInput"
              className="input-sm config-input"
            />
          </div>

          <div className="setting-item config-field config-field-column">
            <div className="setting-info">
              <h3>Grading Schema (JSON)</h3>
              <p>Map grades to points. Example: {"{ \"A\": 4.0, \"B+\": 3.5, \"W\": null }"}</p>
            </div>
            <textarea
              id="gradingSchemaInput"
              className="config-textarea"
              rows={7}
            ></textarea>
          </div>

          <div className="setting-item config-field config-field-column">
            <div className="setting-info">
              <h3>Grade Display Order</h3>
              <p>Comma-separated list. Example: A, A-, B+, B, C, D, F, W</p>
            </div>
            <input
              type="text"
              id="gradeDisplayOrderInput"
              className="input-sm config-input"
              placeholder="A, A-, B+, B, C, D, F, W"
            />
          </div>

          <div className="setting-item config-field config-field-column">
            <div className="setting-info">
              <h3>Available Presets</h3>
              <p>Load presets from backend and apply one quickly.</p>
            </div>
            <select id="gradingPresetSelect" className="input-sm config-input"></select>
            <button className="btn btn-secondary btn-sm" id="applyPresetBtn">
              Apply Selected Preset
            </button>
          </div>
        </div>

        <div className="config-actions">
          <button className="btn btn-secondary" id="loadTranscriptConfigBtn">
            Load Current
          </button>
          <button className="btn btn-secondary" id="loadTranscriptPresetsBtn">
            Load Presets
          </button>
          <button className="btn btn-secondary" id="recommendConfigBtn">
            Recommend (Mock)
          </button>
          <button className="btn btn-primary" id="saveTranscriptConfigBtn">
            Save Config
          </button>
          <button className="btn btn-secondary" id="resetTranscriptConfigBtn">
            Reset Default
          </button>
        </div>
      </div>

      {/* Settings Screen */}
      <div id="settingsScreen" className="screen hidden">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button className="btn-back" id="backFromSettings">
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
              <input type="checkbox" id="autoSyncToggle" />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Notifications</h3>
              <p>Get notified when sync is complete</p>
            </div>
            <label className="toggle">
              <input type="checkbox" id="notificationsToggle" defaultChecked />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Require Student ID</h3>
              <p>Block sync until Student ID is filled in dashboard</p>
            </div>
            <label className="toggle">
              <input type="checkbox" id="requireStudentIdToggle" />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="setting-item">
            <div className="setting-info">
              <h3>Clear Cache</h3>
              <p>Remove all locally stored academic data</p>
            </div>
            <button className="btn btn-secondary btn-sm" id="clearDataBtn">
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Review Modal Overlay */}
      <div id="reviewOverlay" className="consent-overlay hidden">
        <div className="consent-modal">
          <div className="consent-header">
            <h2>Review Scraped Data</h2>
            <button className="btn-close" id="closeReviewBtn">
              ×
            </button>
          </div>

          <div className="consent-body">
            <p className="consent-intro">
              Review the extracted data before it is sent to the backend.
            </p>

            <div className="consent-items" id="reviewSummary"></div>

            <div className="review-payload-wrap">
              <div className="review-payload-title">Upload Payload Preview</div>
              <pre className="review-payload" id="reviewPayload"></pre>
            </div>
          </div>

          <div className="consent-actions">
            <button className="btn btn-secondary" id="cancelReviewBtn">
              Cancel
            </button>
            <button className="btn btn-primary" id="continueReviewBtn">
              Continue
            </button>
          </div>
        </div>
      </div>

      {/* Consent Modal Overlay */}
      <div id="consentOverlay" className="consent-overlay hidden">
        <div className="consent-modal">
          <div className="consent-header">
            <h2>Data Extraction Consent</h2>
            <button className="btn-close" id="closeConsentBtn">
              ×
            </button>
          </div>

          <div className="consent-body">
            <p className="consent-intro">
              VentureScope will extract the following data from your ASTU e-Student
              account:
            </p>

            <div className="consent-items">
              {[
                "Student ID & Name",
                "Courses & Grades",
                "GPA & Academic Standing",
                "Degree Progress & Transcript",
              ].map((label) => (
                <div className="consent-item" key={label}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="#0066ff">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                  </svg>
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="consent-warning">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="#f59e0b">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                />
              </svg>
              <span>This data will be securely stored locally on your device.</span>
            </div>

            <p className="consent-terms">
              By clicking "Accept," you agree to allow VentureScope to extract your
              academic data from ASTU e-Student portal.
            </p>
          </div>

          <div className="consent-actions">
            <button className="btn btn-secondary" id="declineConsentBtn">
              Decline
            </button>
            <button className="btn btn-primary" id="acceptConsentBtn">
              Accept & Extract
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

