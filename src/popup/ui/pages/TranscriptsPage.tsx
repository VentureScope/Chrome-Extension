import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listTranscripts,
  getTranscriptById,
  deleteTranscript,
} from "../../api/transcripts";
import { Button } from "../components/Button";

export function TranscriptsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listTranscripts();
      setTranscripts(res.transcripts || []);
    } catch (e: any) {
      setError(e?.message || "Unable to load transcripts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("Delete this transcript? This cannot be undone.")) return;
    try {
      await deleteTranscript(id);
      setTranscripts((t) => t.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message || "Delete failed.");
    }
  }

  return (
    <div className="screen">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </Button>
        <h2
          style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}
        >
          Transcripts
        </h2>
      </div>

      {error ? <div className="config-status status-error">{error}</div> : null}

      <div style={{ marginTop: 12 }}>
        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <p className="empty-state">Loading…</p>
        ) : transcripts.length === 0 ? (
          <p className="empty-state">No transcripts found.</p>
        ) : (
          <div className="data-container">
            {transcripts.map((t) => (
              <div
                key={t.id}
                className="data-section"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {t.student_id || t.studentId || "Unknown Student"}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Version {t.version} • Uploaded{" "}
                      {new Date(t.uploaded_at || t.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                    >
                      {expandedId === t.id ? "Hide" : "View"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(t.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                {expandedId === t.id && (
                  <div
                    style={{
                      maxHeight: "300px",
                      overflowY: "auto",
                      backgroundColor: "#f8fafc",
                      padding: "12px",
                      borderRadius: "6px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all"
                    }}
                  >
                    {JSON.stringify(t.transcript_data || t, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TranscriptsPage;
