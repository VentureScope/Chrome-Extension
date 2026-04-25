import { create } from "zustand";
import type { AcademicData, TranscriptConfig, UserSession } from "../lib/types";
import { storageGet, storageRemove, storageSet } from "../lib/chrome-storage";

const STORAGE_KEYS = [
  "user",
  "syncedData",
  "userConsent",
  "transcriptConfig",
  "autoSyncToggle",
  "notificationsToggle",
  "manualStudentId",
  "requireStudentIdToggle",
] as const;

type StorageShape = {
  user: UserSession | null;
  syncedData: AcademicData | null;
  userConsent: boolean;
  transcriptConfig: TranscriptConfig | null;
  autoSyncToggle: boolean;
  notificationsToggle: boolean;
  manualStudentId: string;
  requireStudentIdToggle: boolean;
};

export const DEFAULT_TRANSCRIPT_CONFIG: TranscriptConfig = {
  gpa_scale: 4,
  grading_schema: {
    A: 4,
    "A-": 3.7,
    "B+": 3.3,
    B: 3,
    "B-": 2.7,
    "C+": 2.3,
    C: 2,
    "C-": 1.7,
    D: 1,
    F: 0,
    W: null,
    IP: null,
  },
  grade_display_order: ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F", "W", "IP"],
};

export type ActivityStage =
  | "idle"
  | "extracting"
  | "review"
  | "consent"
  | "syncing"
  | "success"
  | "error";

export type AppState = {
  hydrated: boolean;

  // persisted
  user: UserSession | null;
  syncedData: AcademicData | null;
  userConsent: boolean;
  transcriptConfig: TranscriptConfig;
  autoSyncToggle: boolean;
  notificationsToggle: boolean;
  manualStudentId: string;
  requireStudentIdToggle: boolean;

  // ui/runtime
  activityStage: ActivityStage;
  activityMessage: string | null;
  lastError: string | null;
  pendingReview: { data: AcademicData; payload: any } | null;

  hydrate: () => Promise<void>;
  setUser: (user: UserSession | null) => Promise<void>;
  setConsent: (value: boolean) => Promise<void>;
  setSyncedData: (data: AcademicData | null) => Promise<void>;
  setSettings: (patch: Partial<Pick<AppState, "autoSyncToggle" | "notificationsToggle" | "manualStudentId" | "requireStudentIdToggle">>) => Promise<void>;
  setTranscriptConfig: (config: TranscriptConfig) => Promise<void>;
  clearSession: () => Promise<void>;

  setActivity: (stage: ActivityStage, message?: string | null) => void;
  setError: (message: string | null) => void;
  setPendingReview: (value: AppState["pendingReview"]) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,

  user: null,
  syncedData: null,
  userConsent: false,
  transcriptConfig: DEFAULT_TRANSCRIPT_CONFIG,
  autoSyncToggle: false,
  notificationsToggle: true,
  manualStudentId: "",
  requireStudentIdToggle: false,

  activityStage: "idle",
  activityMessage: null,
  lastError: null,
  pendingReview: null,

  hydrate: async () => {
    const values = (await storageGet<StorageShape>([...STORAGE_KEYS])) as Partial<StorageShape>;
    set({
      user: values.user ?? null,
      syncedData: values.syncedData ?? null,
      userConsent: Boolean(values.userConsent),
      transcriptConfig: values.transcriptConfig ?? DEFAULT_TRANSCRIPT_CONFIG,
      autoSyncToggle: Boolean(values.autoSyncToggle),
      notificationsToggle: values.notificationsToggle === undefined ? true : Boolean(values.notificationsToggle),
      manualStudentId: String(values.manualStudentId ?? ""),
      requireStudentIdToggle: Boolean(values.requireStudentIdToggle),
      hydrated: true,
    });
  },

  setUser: async (user) => {
    set({ user });
    await storageSet<StorageShape>({ user });
  },

  setConsent: async (value) => {
    set({ userConsent: value });
    await storageSet<StorageShape>({ userConsent: value });
  },

  setSyncedData: async (data) => {
    set({ syncedData: data });
    await storageSet<StorageShape>({ syncedData: data });
  },

  setSettings: async (patch) => {
    set(patch as any);
    await storageSet<StorageShape>(patch as any);
  },

  setTranscriptConfig: async (config) => {
    set({ transcriptConfig: config });
    await storageSet<StorageShape>({ transcriptConfig: config });
  },

  clearSession: async () => {
    set({
      user: null,
      syncedData: null,
      userConsent: false,
      pendingReview: null,
      activityStage: "idle",
      activityMessage: null,
      lastError: null,
    });
    await storageRemove(["user", "syncedData", "userConsent", "transcriptConfig"]);
  },

  setActivity: (stage, message = null) => set({ activityStage: stage, activityMessage: message }),
  setError: (message) => set({ lastError: message, activityStage: message ? "error" : get().activityStage }),
  setPendingReview: (value) => set({ pendingReview: value }),
}));

