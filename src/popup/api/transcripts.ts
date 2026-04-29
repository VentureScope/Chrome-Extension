import { api, getApiErrorMessage } from "./client";
import type { TranscriptConfig, TranscriptCreatePayload } from "../lib/types";

const TRANSCRIPT_LOG_PREFIX = "[Transcript API]";

export async function uploadTranscript(payload: TranscriptCreatePayload) {
  const startedAt = Date.now();
  console.log(`${TRANSCRIPT_LOG_PREFIX} uploadTranscript:start`, {
    endpoint: "/api/transcripts/",
    studentId: payload?.transcript_data?.student_id,
    semesterCount: payload?.transcript_data?.semesters?.length || 0,
    payload,
  });
  try {
    const res = await api.post("/api/transcripts/", payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 300000,
    });
    console.log(`${TRANSCRIPT_LOG_PREFIX} uploadTranscript:success`, {
      elapsedMs: Date.now() - startedAt,
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} uploadTranscript:error`, {
      elapsedMs: Date.now() - startedAt,
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getLatestTranscript() {
  const startedAt = Date.now();
  console.log(`${TRANSCRIPT_LOG_PREFIX} getLatestTranscript:start`, {
    endpoint: "/api/transcripts/latest",
  });
  try {
    const res = await api.get("/api/transcripts/latest");
    console.log(`${TRANSCRIPT_LOG_PREFIX} getLatestTranscript:success`, {
      elapsedMs: Date.now() - startedAt,
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} getLatestTranscript:error`, {
      elapsedMs: Date.now() - startedAt,
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getTranscriptConfig(): Promise<TranscriptConfig> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfig:start`);
  try {
    const res = await api.get("/api/transcript-configs/");
    console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfig:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfig:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function saveTranscriptConfig(
  payload: TranscriptConfig,
): Promise<TranscriptConfig> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} saveTranscriptConfig:start`, {
    payload,
  });
  try {
    const res = await api.put("/api/transcript-configs/", payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`${TRANSCRIPT_LOG_PREFIX} saveTranscriptConfig:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} saveTranscriptConfig:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function resetTranscriptConfig(): Promise<void> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} resetTranscriptConfig:start`);
  try {
    await api.delete("/api/transcript-configs/");
    console.log(`${TRANSCRIPT_LOG_PREFIX} resetTranscriptConfig:success`);
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} resetTranscriptConfig:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getTranscriptConfigPresets(): Promise<any[]> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfigPresets:start`);
  try {
    // presets endpoint doesn’t require auth in legacy logic
    const res = await api.get("/api/transcript-configs/presets", {
      headers: { Authorization: undefined },
    });
    console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfigPresets:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data?.presets || [];
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} getTranscriptConfigPresets:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function listTranscripts(): Promise<{
  transcripts: any[];
  total_count: number;
}> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} listTranscripts:start`);
  try {
    const res = await api.get("/api/transcripts/");
    console.log(`${TRANSCRIPT_LOG_PREFIX} listTranscripts:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} listTranscripts:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function getTranscriptById(transcriptId: string) {
  console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptById:start`, {
    transcriptId,
  });
  try {
    const res = await api.get(`/api/transcripts/${transcriptId}`);
    console.log(`${TRANSCRIPT_LOG_PREFIX} getTranscriptById:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} getTranscriptById:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function deleteTranscript(transcriptId: string): Promise<void> {
  console.log(`${TRANSCRIPT_LOG_PREFIX} deleteTranscript:start`, {
    transcriptId,
  });
  try {
    await api.delete(`/api/transcripts/${transcriptId}`);
    console.log(`${TRANSCRIPT_LOG_PREFIX} deleteTranscript:success`);
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} deleteTranscript:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}

export async function recommendConfig(payload: any) {
  console.log(`${TRANSCRIPT_LOG_PREFIX} recommendConfig:start`);
  try {
    const res = await api.post(`/api/transcripts/recommend-config`, payload, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`${TRANSCRIPT_LOG_PREFIX} recommendConfig:success`, {
      status: res.status,
      data: res.data,
    });
    return res.data;
  } catch (e) {
    console.error(`${TRANSCRIPT_LOG_PREFIX} recommendConfig:error`, {
      error: e,
    });
    throw new Error(getApiErrorMessage(e));
  }
}
