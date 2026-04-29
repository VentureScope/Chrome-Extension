import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import {
  getTranscriptConfig,
  getTranscriptConfigPresets,
  resetTranscriptConfig,
  saveTranscriptConfig,
} from "../../api/transcripts";
import { DEFAULT_TRANSCRIPT_CONFIG, useAppStore } from "../../state/store";
import type { TranscriptConfig } from "../../lib/types";

export function TranscriptConfigPage() {
  const navigate = useNavigate();
  const localConfig = useAppStore((s) => s.transcriptConfig);
  const setTranscriptConfig = useAppStore((s) => s.setTranscriptConfig);

  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    msg: string;
  }>({ type: "idle", msg: "No changes yet." });
  const [presets, setPresets] = useState<any[]>([]);
  const [presetIndex, setPresetIndex] = useState<string>("");

  const [gpaScale, setGpaScale] = useState<number>(localConfig.gpa_scale);
  const [gradingSchemaJson, setGradingSchemaJson] = useState<string>(
    JSON.stringify(localConfig.grading_schema, null, 2),
  );
  const [gradeDisplayOrder, setGradeDisplayOrder] = useState<string>(
    (localConfig.grade_display_order || []).join(", "),
  );

  const parsedConfig = useMemo<TranscriptConfig | null>(() => {
    try {
      const schema = JSON.parse(gradingSchemaJson || "{}");
      const order = gradeDisplayOrder
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      return {
        gpa_scale: Number(gpaScale),
        grading_schema: schema,
        grade_display_order: order,
      };
    } catch {
      return null;
    }
  }, [gpaScale, gradingSchemaJson, gradeDisplayOrder]);

  async function loadCurrent() {
    try {
      const cfg = await getTranscriptConfig();
      await setTranscriptConfig({
        gpa_scale: cfg.gpa_scale,
        grading_schema: cfg.grading_schema,
        grade_display_order: cfg.grade_display_order,
      });
      setGpaScale(cfg.gpa_scale);
      setGradingSchemaJson(JSON.stringify(cfg.grading_schema, null, 2));
      setGradeDisplayOrder((cfg.grade_display_order || []).join(", "));
      setStatus({
        type: "success",
        msg: "Loaded transcript config from backend.",
      });
    } catch (e: any) {
      setStatus({
        type: "error",
        msg: e?.message || "Unable to load transcript config.",
      });
    }
  }

  async function loadPresets() {
    try {
      const p = await getTranscriptConfigPresets();
      setPresets(p);
      setStatus({ type: "success", msg: `Loaded ${p.length} presets.` });
    } catch (e: any) {
      setStatus({
        type: "error",
        msg: e?.message || "Unable to load presets.",
      });
    }
  }

  function applyPreset() {
    const idx = Number(presetIndex);
    if (!Number.isFinite(idx) || !presets[idx]) {
      setStatus({ type: "error", msg: "Select a preset before applying." });
      return;
    }
    const preset = presets[idx];
    setGpaScale(preset.gpa_scale);
    setGradingSchemaJson(JSON.stringify(preset.grading_schema, null, 2));
    setGradeDisplayOrder((preset.grade_display_order || []).join(", "));
    setStatus({
      type: "success",
      msg: `Applied preset: ${preset.name}. Click Save Config to persist.`,
    });
  }

  async function save() {
    if (!parsedConfig) {
      setStatus({ type: "error", msg: "Grading schema must be valid JSON." });
      return;
    }
    if (
      !Number.isFinite(parsedConfig.gpa_scale) ||
      parsedConfig.gpa_scale <= 0 ||
      parsedConfig.gpa_scale > 100
    ) {
      setStatus({
        type: "error",
        msg: "GPA scale must be a number between 0 and 100.",
      });
      return;
    }
    if (!parsedConfig.grade_display_order.length) {
      setStatus({ type: "error", msg: "Grade display order cannot be empty." });
      return;
    }
    try {
      const saved = await saveTranscriptConfig(parsedConfig);
      await setTranscriptConfig(saved);
      setStatus({
        type: "success",
        msg: "Transcript config saved to backend.",
      });
    } catch (e: any) {
      setStatus({
        type: "error",
        msg: e?.message || "Unable to save transcript config.",
      });
    }
  }

  async function reset() {
    try {
      await resetTranscriptConfig();
      await setTranscriptConfig(DEFAULT_TRANSCRIPT_CONFIG);
      setGpaScale(DEFAULT_TRANSCRIPT_CONFIG.gpa_scale);
      setGradingSchemaJson(
        JSON.stringify(DEFAULT_TRANSCRIPT_CONFIG.grading_schema, null, 2),
      );
      setGradeDisplayOrder(
        DEFAULT_TRANSCRIPT_CONFIG.grade_display_order.join(", "),
      );
      setStatus({
        type: "success",
        msg: "Transcript config reset to backend defaults.",
      });
    } catch (e: any) {
      setStatus({
        type: "error",
        msg: e?.message || "Unable to reset config.",
      });
    }
  }

  useEffect(() => {
    // Load presets opportunistically; failures are non-fatal.
    loadPresets().catch(() => {});
  }, []);

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
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            />
          </svg>
        </Button>
        <h2
          style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}
        >
          Transcript Config
        </h2>
      </div>

      <p className="subtitle" style={{ marginTop: -8 }}>
        Configure grading scale and schema used for transcript uploads.
      </p>

      <div
        className={[
          "config-status",
          status.type === "success" ? "status-success" : "",
          status.type === "error" ? "status-error" : "",
        ].join(" ")}
      >
        {status.msg}
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
            className="input-sm config-input"
            value={gpaScale}
            onChange={(e) => setGpaScale(Number(e.target.value))}
          />
        </div>

        <div className="setting-item config-field config-field-column">
          <div className="setting-info">
            <h3>Grading Schema (JSON)</h3>
            <p>
              Map grades to points. Example:{" "}
              {'{ "A": 4.0, "B+": 3.5, "W": null }'}
            </p>
          </div>
          <textarea
            className="config-textarea"
            rows={7}
            value={gradingSchemaJson}
            onChange={(e) => setGradingSchemaJson(e.target.value)}
          />
        </div>

        <div className="setting-item config-field config-field-column">
          <div className="setting-info">
            <h3>Grade Display Order</h3>
            <p>Comma-separated list. Example: A, A-, B+, B, C, D, F, W</p>
          </div>
          <input
            type="text"
            className="input-sm config-input"
            placeholder="A, A-, B+, B, C, D, F, W"
            value={gradeDisplayOrder}
            onChange={(e) => setGradeDisplayOrder(e.target.value)}
          />
        </div>

        <div className="setting-item config-field config-field-column">
          <div className="setting-info">
            <h3>Available Presets</h3>
            <p>Load presets from backend and apply one quickly.</p>
          </div>
          <select
            className="input-sm config-input"
            value={presetIndex}
            onChange={(e) => setPresetIndex(e.target.value)}
          >
            <option value="">
              {presets.length ? "Select a preset" : "No presets loaded"}
            </option>
            {presets.map((preset, idx) => (
              <option key={preset.name || idx} value={String(idx)}>
                {preset.name} - {preset.description}
              </option>
            ))}
          </select>
          <Button variant="secondary" size="sm" onClick={applyPreset}>
            Apply Selected Preset
          </Button>
        </div>
      </div>

      <div className="config-actions">
        <Button variant="secondary" onClick={loadCurrent}>
          Load Current
        </Button>
        <Button variant="secondary" onClick={loadPresets}>
          Load Presets
        </Button>
        <Button variant="primary" onClick={save}>
          Save Config
        </Button>
        <Button variant="secondary" onClick={reset}>
          Reset Default
        </Button>
      </div>
    </div>
  );
}
