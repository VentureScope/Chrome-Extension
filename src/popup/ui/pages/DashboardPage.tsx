import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { ConsentModal, ReviewModal } from "../components/Modals";
import { Button } from "../components/Button";
import { logout } from "../../api/auth";
import { uploadTranscript, getLatestTranscript } from "../../api/transcripts";
import { useAppStore } from "../../state/store";
import { extractFromActiveTab } from "../../lib/scrape";
import { buildTranscriptCreatePayload } from "../../lib/payload";
import type { AcademicData } from "../../lib/types";
import { normalizeStudentId } from "../../lib/normalize";

const DASHBOARD_LOG_PREFIX = "[Dashboard Sync]";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function DashboardPage() {
  const navigate = useNavigate();

  const user = useAppStore((s) => s.user)!;
  const userConsent = useAppStore((s) => s.userConsent);
  const setConsent = useAppStore((s) => s.setConsent);
  const transcriptConfig = useAppStore((s) => s.transcriptConfig);
  const syncedData = useAppStore((s) => s.syncedData);
  const setSyncedData = useAppStore((s) => s.setSyncedData);
  const manualStudentId = useAppStore((s) => s.manualStudentId);
  const requireStudentIdToggle = useAppStore((s) => s.requireStudentIdToggle);
  const setSettings = useAppStore((s) => s.setSettings);
  const clearSession = useAppStore((s) => s.clearSession);

  const activityStage = useAppStore((s) => s.activityStage);
  const activityMessage = useAppStore((s) => s.activityMessage);
  const setActivity = useAppStore((s) => s.setActivity);
  const lastError = useAppStore((s) => s.lastError);
  const setError = useAppStore((s) => s.setError);
  const pendingReview = useAppStore((s) => s.pendingReview);
  const setPendingReview = useAppStore((s) => s.setPendingReview);

  const [syncing, setSyncing] = useState(false);

  const reviewOpen = Boolean(pendingReview);
  const consentOpen = activityStage === "consent";

  const resolvedStudentId = useMemo(
    () => normalizeStudentId(manualStudentId).trim(),
    [manualStudentId],
  );

  async function onLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    await logout();
    await clearSession();
    navigate("/login", { replace: true });
  }

  function applyManualStudentId(data: AcademicData): AcademicData {
    if (!resolvedStudentId) return data;
    return {
      ...data,
      studentId: resolvedStudentId,
      transcriptData: {
        ...(data.transcriptData || { student_id: null, semesters: [] }),
        student_id: resolvedStudentId,
        semesters: data.transcriptData?.semesters || [],
      },
    };
  }

  async function startSync() {
    const startedAt = Date.now();
    console.log(`${DASHBOARD_LOG_PREFIX} startSync:start`, {
      requireStudentIdToggle,
      resolvedStudentId,
      hasConsent: userConsent,
    });

    setError(null);
    if (requireStudentIdToggle && !resolvedStudentId) {
      console.warn(`${DASHBOARD_LOG_PREFIX} startSync:blocked`, {
        reason: "Student ID required but missing",
      });
      setActivity("error", "Student ID is required. Enter it before syncing.");
      return;
    }

    setSyncing(true);
    setActivity(
      "extracting",
      "Step 1/3: Extracting transcript data from ASTU portal…",
    );

    try {
      console.log(`${DASHBOARD_LOG_PREFIX} step1_extract:start`);
      const scraped = await extractFromActiveTab();
      console.log(`${DASHBOARD_LOG_PREFIX} step1_extract:success`, {
        studentId: scraped?.studentId,
        courseCount: scraped?.courses?.length || 0,
        semesterCount: scraped?.transcriptData?.semesters?.length || 0,
      });

      const data = applyManualStudentId(scraped);
      console.log(`${DASHBOARD_LOG_PREFIX} studentId:resolved`, {
        original: scraped?.studentId,
        resolved: data?.studentId,
      });

      const payload = buildTranscriptCreatePayload(data, transcriptConfig);
      console.log(`${DASHBOARD_LOG_PREFIX} payload:built`, {
        elapsedMs: Date.now() - startedAt,
        payload,
        semesterCount: payload?.transcript_data?.semesters?.length || 0,
      });

      if (!payload?.transcript_data?.semesters?.length) {
        console.error(`${DASHBOARD_LOG_PREFIX} payload:invalid`, {
          reason: "No valid transcript semesters found",
          payload,
        });
        throw new Error("No valid transcript semesters found for upload.");
      }

      setPendingReview({ data, payload });
      console.log(`${DASHBOARD_LOG_PREFIX} step2_review:ready`, {
        elapsedMs: Date.now() - startedAt,
      });
      setActivity(
        "review",
        "Step 2/3: Extraction complete. Review and confirm apply.",
      );
    } catch (e: any) {
      console.error(`${DASHBOARD_LOG_PREFIX} startSync:error`, {
        elapsedMs: Date.now() - startedAt,
        error: e,
      });
      setActivity("error", e?.message || "Unable to scrape transcript data.");
    } finally {
      console.log(`${DASHBOARD_LOG_PREFIX} startSync:finish`, {
        elapsedMs: Date.now() - startedAt,
      });
      setSyncing(false);
    }
  }

  async function continueFromReview() {
    console.log(`${DASHBOARD_LOG_PREFIX} continueFromReview`, {
      hasPendingReview: Boolean(pendingReview),
      hasConsent: userConsent,
    });
    if (!pendingReview) return;
    setPendingReview(null);
    if (userConsent) {
      await applyAndUpload(pendingReview.data, pendingReview.payload);
    } else {
      setActivity("consent", "Waiting for consent…");
    }
  }

  async function acceptConsent() {
    console.log(`${DASHBOARD_LOG_PREFIX} consent:accepted`, {
      hasPendingReview: Boolean(pendingReview),
    });
    await setConsent(true);
    setActivity(
      "syncing",
      "Step 3/3: Uploading transcript payload to backend…",
    );
    if (pendingReview) {
      const { data, payload } = pendingReview;
      setPendingReview(null);
      await applyAndUpload(data, payload);
    }
  }

  function declineConsent() {
    console.warn(`${DASHBOARD_LOG_PREFIX} consent:declined`);
    setPendingReview(null);
    setActivity("idle", null);
    alert("Sync declined. No data was uploaded.");
  }

  async function applyAndUpload(data: AcademicData, payload: any) {
    const startedAt = Date.now();
    console.log(`${DASHBOARD_LOG_PREFIX} applyAndUpload:start`, {
      studentId: payload?.transcript_data?.student_id,
      semesterCount: payload?.transcript_data?.semesters?.length || 0,
      payload,
    });

    setError(null);
    setSyncing(true);
    try {
      setActivity("syncing", "Step 3/3: Sending POST /api/transcripts/…");
      console.log(`${DASHBOARD_LOG_PREFIX} upload:request:start`);
      const uploadRes = await uploadTranscript(payload);
      console.log(`${DASHBOARD_LOG_PREFIX} upload:request:success`, {
        elapsedMs: Date.now() - startedAt,
        uploadRes,
      });

      let latest = null;
      try {
        console.log(`${DASHBOARD_LOG_PREFIX} latest:request:start`);
        latest = await getLatestTranscript();
        console.log(`${DASHBOARD_LOG_PREFIX} latest:request:success`, {
          latest,
        });
      } catch (latestError) {
        console.warn(`${DASHBOARD_LOG_PREFIX} latest:request:error`, {
          error: latestError,
        });
      }

      const merged: AcademicData = {
        ...data,
        syncTime: new Date().toISOString(),
        backend: { upload: uploadRes, latest },
      };
      await setSyncedData(merged);
      console.log(`${DASHBOARD_LOG_PREFIX} state:syncedData:updated`, {
        syncTime: merged.syncTime,
      });
      setActivity("success", "Sync complete.");
      console.log(`${DASHBOARD_LOG_PREFIX} applyAndUpload:success`, {
        elapsedMs: Date.now() - startedAt,
      });

      globalThis.chrome?.runtime
        ?.sendMessage?.({ action: "syncComplete" })
        .catch?.(() => {});
    } catch (e: any) {
      console.error(`${DASHBOARD_LOG_PREFIX} applyAndUpload:error`, {
        elapsedMs: Date.now() - startedAt,
        error: e,
      });
      setActivity("error", e?.message || "Sync failed.");
      setError(e?.message || "Sync failed.");
    } finally {
      console.log(`${DASHBOARD_LOG_PREFIX} applyAndUpload:finish`, {
        elapsedMs: Date.now() - startedAt,
      });
      setSyncing(false);
    }
  }

  function activityBody() {
    if (activityStage === "idle")
      return <p className="empty-state">No sync activity yet.</p>;
    if (activityStage === "error")
      return (
        <p className="activity-description">{lastError || activityMessage}</p>
      );
    return (
      <p className="activity-description">{activityMessage || activityStage}</p>
    );
  }

  return (
    <div className="screen">
      <Header compact />

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
          id="manualStudentIdInput"
          type="text"
          placeholder="Enter Student ID for upload payload"
          value={manualStudentId}
          onChange={(e) => setSettings({ manualStudentId: e.target.value })}
        />
      </div>

      <Button variant="primary" onClick={startSync} disabled={syncing}>
        <span>{syncing ? "Syncing…" : "Sync Academic Data"}</span>
      </Button>

      <div className="quick-actions">
        <Button variant="secondary" onClick={() => navigate("/data")}>
          View Synced Data
        </Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/transcript-config")}
        >
          Transcript Config
        </Button>
        <Button variant="secondary" onClick={() => navigate("/transcripts")}>
          Transcripts
        </Button>
        <Button variant="secondary" onClick={() => navigate("/settings")}>
          Settings
        </Button>
      </div>

      <div className="sync-activity">
        <div className="sync-activity-header">
          <h3>Sync Activity</h3>
          <span className="sync-activity-label">Live Feed</span>
        </div>
        <div className="activity-list">{activityBody()}</div>
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
            <span>{initials(user.name)}</span>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
              {user.name}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>{user.email}</div>
          </div>
        </div>
        <Button variant="icon" title="Logout" onClick={onLogout}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 11-2 0V4H5v12h10v-2a1 1 0 112 0v3a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" />
          </svg>
        </Button>
      </div>

      <ReviewModal
        open={reviewOpen}
        data={pendingReview?.data || null}
        payload={pendingReview?.payload}
        onCancel={() => {
          setPendingReview(null);
          setActivity("idle", null);
        }}
        onContinue={continueFromReview}
      />
      <ConsentModal
        open={consentOpen}
        onDecline={declineConsent}
        onAccept={acceptConsent}
      />
      {syncedData ? null : null}
    </div>
  );
}
