// State management
let currentUser = null;
let syncedData = null;
let userConsent = false;
let pendingSyncData = null;
let transcriptConfig = null;
let gradingPresets = [];
let manualStudentId = "";
let requireStudentIdForSync = false;
let pendingSyncPayload = null;
let syncDebugLog = [];

const API_BASE_URL = "https://backend-1-tcmy.onrender.com";
const LOGIN_API_URL = `${API_BASE_URL}/api/auth/login`;
const TRANSCRIPT_CONFIG_API_URL = `${API_BASE_URL}/api/transcript-configs/`;
const TRANSCRIPT_CONFIG_PRESETS_API_URL = `${API_BASE_URL}/api/transcript-configs/presets`;
const TRANSCRIPT_API_URL = `${API_BASE_URL}/api/transcripts/`;
const TRANSCRIPT_RECOMMEND_API_URL = `${API_BASE_URL}/api/transcripts/recommend-config`;
const TRANSCRIPT_LATEST_API_URL = `${API_BASE_URL}/api/transcripts/latest`;

const DEFAULT_TRANSCRIPT_CONFIG = {
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
  grade_display_order: [
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "C-",
    "D",
    "F",
    "W",
    "IP",
  ],
};

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserSession();
  initializeEventListeners();
});

function getMockSyncData() {
  return {
    studentId: "ETS123456",
    name: "Mock Student",
    email: currentUser?.email || "student@astu.edu.et",
    department: "Computer Engineering",
    year: "Year 4",
    status: "Active",
    gpa: "3.72",
    transcript: {
      totalCourses: 6,
      completedCourses: 6,
      inProgressCourses: 0,
      failedCourses: 0,
      retakenCourses: 0,
      academicStanding: "Good Standing",
      warningsOrProbation: "None",
    },
    degreeProgress: {
      creditsEarned: 108,
      totalCreditsRequired: 140,
      completionPercentage: 77,
      remainingCredits: 32,
      expectedGraduation: "June 2027",
    },
    courses: [
      {
        code: "CENG401",
        name: "Distributed Systems",
        grade: "A",
        credits: 4,
        semester: "First Semester",
      },
      {
        code: "CENG403",
        name: "Machine Learning",
        grade: "A-",
        credits: 4,
        semester: "First Semester",
      },
      {
        code: "MATH401",
        name: "Numerical Methods",
        grade: "B+",
        credits: 3,
        semester: "First Semester",
      },
      {
        code: "CENG404",
        name: "Compiler Design",
        grade: "A",
        credits: 4,
        semester: "Second Semester",
      },
      {
        code: "CENG406",
        name: "Cloud Engineering",
        grade: "B+",
        credits: 3,
        semester: "Second Semester",
      },
      {
        code: "STAT402",
        name: "Applied Statistics",
        grade: "B",
        credits: 3,
        semester: "Second Semester",
      },
    ],
    extractedFrom: "Mock Transcript Data",
    extractedAt: new Date().toISOString(),
  };
}

// Load user session from storage
async function loadUserSession() {
  window.chrome.storage.local.get(
    [
      "user",
      "syncedData",
      "userConsent",
      "transcriptConfig",
      "autoSyncToggle",
      "notificationsToggle",
      "manualStudentId",
      "requireStudentIdToggle",
    ],
    (result) => {
      if (result.user) {
        currentUser = result.user;
        syncedData = result.syncedData || null;
        userConsent = result.userConsent || false;
        manualStudentId = String(result.manualStudentId || "").trim();
        requireStudentIdForSync = Boolean(result.requireStudentIdToggle);
        transcriptConfig = result.transcriptConfig || {
          ...DEFAULT_TRANSCRIPT_CONFIG,
        };

        const autoSyncToggle = document.getElementById("autoSyncToggle");
        const notificationsToggle = document.getElementById(
          "notificationsToggle",
        );
        const requireStudentIdToggle = document.getElementById(
          "requireStudentIdToggle",
        );
        if (autoSyncToggle)
          autoSyncToggle.checked = Boolean(result.autoSyncToggle);
        if (notificationsToggle) {
          notificationsToggle.checked =
            result.notificationsToggle === undefined
              ? true
              : Boolean(result.notificationsToggle);
        }
        if (requireStudentIdToggle) {
          requireStudentIdToggle.checked = requireStudentIdForSync;
        }

        const manualStudentIdInput = document.getElementById(
          "manualStudentIdInput",
        );
        if (manualStudentIdInput) {
          manualStudentIdInput.value = manualStudentId;
        }

        showScreen("dashboard");
        updateDashboard();
      } else {
        showScreen("login");
      }
    },
  );
}

// Event Listeners
function initializeEventListeners() {
  bindClick("logoutBtn", handleLogout);
  bindClick("syncBtn", handleSync);
  bindSubmit("loginForm", handleLogin);

  bindClick("openDataBtn", () => showScreen("data"));
  bindClick("openSettingsBtn", () => showScreen("settings"));
  bindClick("openTranscriptConfigBtn", async () => {
    showScreen("transcriptConfig");
    await loadTranscriptConfig(false);
    await loadTranscriptPresets(false);
  });

  bindClick("backFromData", () => showScreen("dashboard"));
  bindClick("backFromSettings", () => showScreen("dashboard"));
  bindClick("backFromTranscriptConfig", () => showScreen("dashboard"));

  bindClick("clearDataBtn", handleClearData);
  bindChange("autoSyncToggle", handleToggleChange);
  bindChange("notificationsToggle", handleToggleChange);
  bindChange("requireStudentIdToggle", handleRequireStudentIdToggle);
  bindInput("manualStudentIdInput", handleManualStudentIdInput);

  bindClick("loadTranscriptConfigBtn", () => loadTranscriptConfig(true));
  bindClick("loadTranscriptPresetsBtn", () => loadTranscriptPresets(true));
  bindClick("applyPresetBtn", handleApplyPreset);
  bindClick("recommendConfigBtn", handleRecommendConfig);
  bindClick("saveTranscriptConfigBtn", handleSaveTranscriptConfig);
  bindClick("resetTranscriptConfigBtn", handleResetTranscriptConfig);

  bindClick("acceptConsentBtn", handleAcceptConsent);
  bindClick("declineConsentBtn", handleDeclineConsent);
  bindClick("closeConsentBtn", handleDeclineConsent);

  bindClick("continueReviewBtn", handleContinueReview);
  bindClick("cancelReviewBtn", handleCancelReview);
  bindClick("closeReviewBtn", handleCancelReview);
}

function bindClick(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("click", handler);
}

function bindSubmit(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("submit", handler);
}

function bindChange(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("change", handler);
}

function bindInput(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener("input", handler);
}

function handleManualStudentIdInput(e) {
  manualStudentId = String(e.target.value || "").trim();
  window.chrome.storage.local.set({ manualStudentId });
}

function handleRequireStudentIdToggle(e) {
  requireStudentIdForSync = Boolean(e.target.checked);
  window.chrome.storage.local.set({
    requireStudentIdToggle: requireStudentIdForSync,
  });
}

function showConsentModal() {
  document.getElementById("consentOverlay").classList.remove("hidden");
}

function closeConsentModal() {
  document.getElementById("consentOverlay").classList.add("hidden");
}

function handleAcceptConsent() {
  userConsent = true;
  window.chrome.storage.local.set({ userConsent: true });
  closeConsentModal();

  if (pendingSyncData) {
    processSyncData(pendingSyncData, pendingSyncPayload);
    pendingSyncData = null;
    pendingSyncPayload = null;
  }
}

function handleDeclineConsent() {
  closeConsentModal();
  pendingSyncData = null;
  pendingSyncPayload = null;
  const syncBtn = document.getElementById("syncBtn");
  if (syncBtn) syncBtn.disabled = false;
  alert("Sync declined. No data was uploaded.");
}

function showReviewModal(data, payload) {
  renderReviewModalContent(data, payload);
  document.getElementById("reviewOverlay").classList.remove("hidden");
}

function closeReviewModal() {
  document.getElementById("reviewOverlay").classList.add("hidden");
}

function renderReviewModalContent(data, payload) {
  const summaryEl = document.getElementById("reviewSummary");
  const payloadEl = document.getElementById("reviewPayload");

  const semesters = payload?.transcript_data?.semesters || [];
  const courseCount = semesters.reduce(
    (sum, semester) => sum + (semester.courses?.length || 0),
    0,
  );

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div class="consent-item"><span><strong>Student ID:</strong> ${payload?.transcript_data?.student_id || data?.studentId || "Not Provided"}</span></div>
      <div class="consent-item"><span><strong>Student Name:</strong> ${data?.name || "Unknown"}</span></div>
      <div class="consent-item"><span><strong>Semesters:</strong> ${semesters.length}</span></div>
      <div class="consent-item"><span><strong>Courses:</strong> ${courseCount}</span></div>
    `;
  }

  if (payloadEl) {
    const payloadText = JSON.stringify(payload, null, 2);
    payloadEl.textContent =
      payloadText.length > 18000
        ? `${payloadText.slice(0, 18000)}\n... (truncated for preview)`
        : payloadText;
  }
}

function handleContinueReview() {
  closeReviewModal();
  if (userConsent) {
    if (pendingSyncData) {
      processSyncData(pendingSyncData, pendingSyncPayload);
      pendingSyncData = null;
      pendingSyncPayload = null;
    }
  } else {
    showConsentModal();
  }
}

function handleCancelReview() {
  closeReviewModal();
  pendingSyncData = null;
  pendingSyncPayload = null;
  const syncBtn = document.getElementById("syncBtn");
  if (syncBtn) syncBtn.disabled = false;
  updateActivityList("error", "Sync cancelled before upload.");
}

async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");

  loginBtn.innerHTML = "<span>Signing in...</span>";
  loginBtn.disabled = true;

  try {
    const response = await fetch(LOGIN_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const apiMessage =
        payload?.message ||
        payload?.detail ||
        "Login failed. Please check your credentials.";
      throw new Error(apiMessage);
    }

    const apiUser = payload?.user || payload?.data?.user || payload?.data || {};
    const displayName =
      apiUser.name ||
      [apiUser.first_name, apiUser.last_name].filter(Boolean).join(" ") ||
      email.split("@")[0];

    currentUser = {
      id: String(apiUser.id || apiUser.user_id || email),
      email: apiUser.email || email,
      name: displayName,
      token:
        payload?.token ||
        payload?.access_token ||
        payload?.data?.token ||
        payload?.data?.access_token ||
        null,
      loginTime: new Date().toISOString(),
    };

    window.chrome.storage.local.set({ user: currentUser }, () => {
      showScreen("dashboard");
      updateDashboard();
    });
  } catch (error) {
    alert(error.message || "Unable to connect to login API.");
  } finally {
    loginBtn.innerHTML = "<span>Sign In</span>";
    loginBtn.disabled = false;
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    window.chrome.storage.local.remove(
      ["user", "syncedData", "userConsent", "transcriptConfig"],
      () => {
        currentUser = null;
        syncedData = null;
        userConsent = false;
        transcriptConfig = null;
        showScreen("login");
        document.getElementById("loginForm").reset();
      },
    );
  }
}

async function handleSync() {
  const syncBtn = document.getElementById("syncBtn");
  syncBtn.disabled = true;
  syncDebugLog = [];
  logSyncStep("sync-start");

  const inputEl = document.getElementById("manualStudentIdInput");
  const studentIdValue = String(inputEl?.value || manualStudentId || "").trim();
  logSyncStep("student-id-check", {
    required: requireStudentIdForSync,
    provided: Boolean(studentIdValue),
  });
  if (requireStudentIdForSync && !studentIdValue) {
    syncBtn.disabled = false;
    updateActivityList(
      "error",
      "Student ID is required. Enter it in the dashboard before syncing.",
    );
    return;
  }

  try {
    updateActivityList(
      "progress",
      "Scraping transcript data from ASTU portal...",
    );
    const scrapedData = await extractFromActiveTab();
    logSyncStep("scrape-success", {
      courses: scrapedData?.courses?.length || 0,
      semesters: scrapedData?.transcriptData?.semesters?.length || 0,
    });
    const baseData = scrapedData || getMockSyncData();
    pendingSyncData = applyManualStudentId(baseData);
    pendingSyncPayload = buildTranscriptCreatePayload(pendingSyncData);
    if (!pendingSyncPayload?.transcript_data?.semesters?.length) {
      throw new Error("No valid transcript semesters found for upload.");
    }
    showReviewModal(pendingSyncData, pendingSyncPayload);
  } catch (error) {
    logSyncStep("sync-failed", { error: error.message });
    syncBtn.disabled = false;
    updateActivityList(
      "error",
      `${error.message || "Unable to scrape transcript data."}<br><small>${getSyncDebugSummary()}</small>`,
    );
  }
}

async function extractFromActiveTab() {
  const [tab] = await window.chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!tab?.id) {
    throw new Error("Unable to detect active browser tab.");
  }

  logSyncStep("active-tab", {
    tabId: tab.id,
    url: tab.url || "",
    status: tab.status || "unknown",
  });

  try {
    await window.chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    logSyncStep("script-injected", { tabId: tab.id });
  } catch (_error) {
    // If script already exists, proceed with messaging.
    logSyncStep("script-inject-note", {
      message: _error?.message || "Script may already be injected",
    });
  }

  const tabUrl = String(tab.url || "");
  const isAStuFromUrl = tabUrl.includes("estudent.astu.edu.et");
  logSyncStep("portal-url-check", { isAStuFromUrl, tabUrl });

  const portalCheck = await sendTabMessageWithRetry(
    tab.id,
    { action: "checkPortal" },
    3,
  ).catch(() => null);
  logSyncStep("portal-message-check", { isASTU: Boolean(portalCheck?.isASTU) });

  if (!isAStuFromUrl && !portalCheck?.isASTU) {
    throw new Error(
      "Open ASTU e-Student Academic History page before syncing.",
    );
  }

  try {
    const scrapeResult = await sendTabMessageWithRetry(
      tab.id,
      { action: "scrapeAcademicData" },
      3,
    );
    logSyncStep("scrape-message-response", {
      success: Boolean(scrapeResult?.success),
      hasData: Boolean(scrapeResult?.data),
    });

    if (!scrapeResult?.success || !scrapeResult?.data) {
      throw new Error(
        scrapeResult?.error || "Failed to scrape ASTU transcript data.",
      );
    }

    return scrapeResult.data;
  } catch (messageError) {
    logSyncStep("scrape-message-fallback", {
      error: messageError?.message || "Message scraping failed",
    });

    const directResult = await scrapeViaInjectedFunction(tab.id);
    logSyncStep("scrape-fallback-response", {
      success: Boolean(directResult?.success),
      hasData: Boolean(directResult?.data),
    });

    if (!directResult?.success || !directResult?.data) {
      throw new Error(
        directResult?.error ||
          messageError?.message ||
          "Failed to scrape ASTU transcript data.",
      );
    }

    return directResult.data;
  }
}

async function sendTabMessageWithRetry(tabId, message, maxAttempts = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    logSyncStep("tab-message-attempt", {
      action: message?.action || "unknown",
      attempt,
      maxAttempts,
      tabId,
    });
    try {
      const response = await new Promise((resolve, reject) => {
        window.chrome.tabs.sendMessage(tabId, message, (result) => {
          if (window.chrome.runtime.lastError) {
            reject(new Error(window.chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });

      logSyncStep("tab-message-success", {
        action: message?.action || "unknown",
        attempt,
      });
      return response;
    } catch (error) {
      lastError = error;
      logSyncStep("tab-message-failed", {
        action: message?.action || "unknown",
        attempt,
        error: error.message,
      });
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }
  }

  throw lastError || new Error("Failed to communicate with active tab.");
}

async function scrapeViaInjectedFunction(tabId) {
  const [{ result } = {}] = await window.chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const clean = (value) =>
        String(value || "")
          .replace(/\s+/g, " ")
          .trim();

      const parseNumber = (value) => {
        if (value === null || value === undefined) return null;
        const normalized = String(value).replace(/,/g, "").trim();
        if (!normalized || normalized === "-") return null;
        const num = Number(normalized);
        return Number.isFinite(num) ? num : null;
      };

      try {
        const sections = Array.from(
          document.querySelectorAll("#transcript .mb-4"),
        );
        const semesters = [];
        const allCourses = [];

        sections.forEach((section) => {
          const academicYear = clean(
            section.querySelector(".card-header h6")?.textContent,
          );
          const semesterLabel = clean(
            section.querySelector(".card-header p")?.textContent,
          );
          if (!academicYear || !semesterLabel) return;

          const rows = Array.from(
            section.querySelectorAll("table tbody tr"),
          ).filter((row) => row.children.length >= 5);

          const courses = rows
            .map((row) => {
              const cells = row.querySelectorAll("td");
              const code = clean(cells[0]?.textContent);
              const title = clean(cells[1]?.textContent);
              const creditHours = parseNumber(cells[2]?.textContent) || 0;
              const grade = clean(cells[3]?.textContent) || "-";
              const points = parseNumber(cells[4]?.textContent);
              if (!code || !title || creditHours <= 0) return null;
              return {
                code,
                title,
                credit_hours: creditHours,
                grade,
                points,
              };
            })
            .filter(Boolean);

          if (!courses.length) return;

          const footerText = clean(section.textContent);
          const sgpaMatch = footerText.match(/SGPA\s*:\s*([0-9.]+)/i);
          const cgpaMatch = footerText.match(/CGPA\s*:\s*([0-9.]+)/i);

          const semesterCreditHours = courses.reduce(
            (sum, c) => sum + Number(c.credit_hours || 0),
            0,
          );
          const semesterPoints = courses.reduce(
            (sum, c) => sum + Number(c.points || 0),
            0,
          );
          const sgpa =
            parseNumber(sgpaMatch?.[1]) ||
            (semesterCreditHours > 0
              ? Number((semesterPoints / semesterCreditHours).toFixed(2))
              : 0);
          const cgpa = parseNumber(cgpaMatch?.[1]) || sgpa;

          semesters.push({
            academic_year: academicYear,
            semester: semesterLabel,
            year_level: null,
            courses,
            semester_summary: {
              credit_hours: Number(semesterCreditHours.toFixed(2)),
              points: Number(semesterPoints.toFixed(2)),
              sgpa: Number(Number(sgpa).toFixed(2)),
              academic_status: null,
            },
            cumulative_summary: {
              credit_hours: Number(semesterCreditHours.toFixed(2)),
              points: Number(semesterPoints.toFixed(2)),
              cgpa: Number(Number(cgpa).toFixed(2)),
            },
          });

          courses.forEach((course) => {
            allCourses.push({
              code: course.code,
              name: course.title,
              grade: course.grade,
              credits: course.credit_hours,
              points: course.points,
              semester: semesterLabel,
              academicYear,
              yearLevel: null,
            });
          });
        });

        if (!semesters.length) {
          return {
            success: false,
            error: "No transcript semesters found on this page.",
          };
        }

        return {
          success: true,
          data: {
            studentId: null,
            name: null,
            email: null,
            department: null,
            year: null,
            status: "Unknown",
            gpa: String(
              semesters[semesters.length - 1]?.cumulative_summary?.cgpa || "",
            ),
            courses: allCourses,
            transcriptData: {
              student_id: null,
              semesters,
            },
            extractedFrom: "ASTU eStudent Portal (Fallback)",
            extractedAt: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error?.message || "Injected scraper failed.",
        };
      }
    },
  });

  return (
    result || { success: false, error: "Injected scraper returned no result." }
  );
}

function logSyncStep(step, details = {}) {
  const entry = {
    time: new Date().toISOString(),
    step,
    ...details,
  };
  syncDebugLog.push(entry);
  if (syncDebugLog.length > 30) {
    syncDebugLog = syncDebugLog.slice(-30);
  }
  console.log("[VentureScope Sync]", entry);
}

function getSyncDebugSummary() {
  if (!syncDebugLog.length) return "No debug trail.";
  return syncDebugLog
    .slice(-8)
    .map((entry) => `${entry.step}${entry.error ? `: ${entry.error}` : ""}`)
    .join(" | ");
}

function applyManualStudentId(data) {
  const inputEl = document.getElementById("manualStudentIdInput");
  const resolvedStudentId = String(
    inputEl?.value || manualStudentId || "",
  ).trim();
  if (!resolvedStudentId) {
    return data;
  }

  manualStudentId = resolvedStudentId;
  window.chrome.storage.local.set({ manualStudentId: resolvedStudentId });

  return {
    ...data,
    studentId: resolvedStudentId,
    transcriptData: {
      ...(data.transcriptData || {}),
      student_id: resolvedStudentId,
      semesters: data.transcriptData?.semesters || [],
    },
  };
}

async function processSyncData(data, prebuiltPayload = null) {
  const syncBtn = document.getElementById("syncBtn");

  try {
    updateActivityList("progress", "Preparing transcript payload...");

    const transcriptPayload =
      prebuiltPayload || buildTranscriptCreatePayload(data);
    if (!transcriptPayload?.transcript_data?.semesters?.length) {
      throw new Error("No valid transcript semesters found for upload.");
    }

    updateActivityList("progress", "Requesting config recommendation...");
    const recommendation = await recommendTranscriptConfig(transcriptPayload);

    if (recommendation?.suggested_config) {
      transcriptConfig = {
        gpa_scale: recommendation.suggested_config.gpa_scale,
        grading_schema: recommendation.suggested_config.grading_schema,
        grade_display_order:
          recommendation.suggested_config.grade_display_order,
      };
      window.chrome.storage.local.set({ transcriptConfig });
      renderTranscriptConfigForm(transcriptConfig);
    }

    updateActivityList("progress", "Uploading transcript to backend...");
    const uploadResponse = await uploadTranscript(transcriptPayload);

    updateActivityList("progress", "Fetching latest transcript state...");
    const latestTranscript = await getLatestTranscript();

    syncedData = {
      ...data,
      syncTime: new Date().toISOString(),
      backend: {
        recommendation,
        upload: uploadResponse,
        latest: latestTranscript,
      },
    };

    window.chrome.storage.local.set({ syncedData }, () => {
      updateDashboard();
      updateActivityList("success", {
        courses: data.courses?.length || 0,
        preset: recommendation?.recommended_preset,
      });
      window.chrome.runtime
        .sendMessage({ action: "syncComplete" })
        .catch(() => {});
    });
  } catch (error) {
    updateActivityList("error", error.message || "Sync failed.");
  } finally {
    setTimeout(() => {
      syncBtn.disabled = false;
    }, 900);
  }
}

function buildTranscriptCreatePayload(data) {
  if (data?.transcriptData?.semesters?.length) {
    return {
      transcript_data: {
        student_id: data.transcriptData.student_id || data.studentId || null,
        semesters: normalizeScrapedSemesters(data.transcriptData.semesters),
      },
    };
  }

  const schema = transcriptConfig || DEFAULT_TRANSCRIPT_CONFIG;
  const scale = Number(schema.gpa_scale || 4);

  const grouped = groupCoursesBySemester(data.courses || []);
  const semesters = [];
  let cumulativeCredits = 0;
  let cumulativePoints = 0;

  Object.entries(grouped).forEach(([semesterName, semesterCourses], index) => {
    const validCourses = semesterCourses.filter(
      (course) => Number(course.credits || 0) > 0,
    );

    if (!validCourses.length) {
      return;
    }

    const creditHours = validCourses.reduce(
      (sum, course) => sum + Number(course.credits || 0),
      0,
    );
    const points = validCourses.reduce((sum, course) => {
      const value = schema.grading_schema?.[course.grade];
      const gradePoint = typeof value === "number" ? value : 0;
      return sum + Number(course.credits || 0) * gradePoint;
    }, 0);

    cumulativeCredits += creditHours;
    cumulativePoints += points;

    const sgpa =
      creditHours > 0 ? Number((points / creditHours).toFixed(2)) : 0;
    const cgpa =
      cumulativeCredits > 0
        ? Number((cumulativePoints / cumulativeCredits).toFixed(2))
        : 0;

    semesters.push({
      academic_year: index === 0 ? "2024/2025" : "2025/2026",
      semester: semesterName,
      year_level: data.year || null,
      courses: validCourses.map((course) => ({
        code: course.code,
        title: course.name || course.title,
        credit_hours: Number(course.credits || 0),
        grade: course.grade,
        points:
          typeof schema.grading_schema?.[course.grade] === "number"
            ? Number(
                (
                  Number(course.credits || 0) *
                  schema.grading_schema[course.grade]
                ).toFixed(2),
              )
            : null,
      })),
      semester_summary: {
        credit_hours: creditHours,
        points: Number(points.toFixed(2)),
        sgpa,
        academic_status: data.status || "Active",
      },
      cumulative_summary: {
        credit_hours: cumulativeCredits,
        points: Number(cumulativePoints.toFixed(2)),
        cgpa: Number(Math.min(cgpa, scale).toFixed(2)),
      },
    });
  });

  return {
    transcript_data: {
      student_id: data.studentId || null,
      semesters,
    },
  };
}

function normalizeScrapedSemesters(semesters) {
  return semesters
    .map((semester) => {
      const courses = (semester.courses || [])
        .map((course) => ({
          code: String(course.code || "").trim(),
          title: String(course.title || course.name || "").trim(),
          credit_hours: Number(course.credit_hours ?? course.credits ?? 0),
          grade: String(course.grade || "-").trim(),
          points:
            course.points === null ||
            course.points === undefined ||
            Number.isNaN(Number(course.points))
              ? null
              : Number(course.points),
        }))
        .filter(
          (course) =>
            course.code &&
            course.title &&
            Number.isFinite(course.credit_hours) &&
            course.credit_hours > 0,
        );

      const semesterCreditHours =
        Number(semester.semester_summary?.credit_hours) ||
        courses.reduce(
          (sum, course) => sum + Number(course.credit_hours || 0),
          0,
        );

      const semesterPoints =
        Number(semester.semester_summary?.points) ||
        courses.reduce((sum, course) => sum + Number(course.points || 0), 0);

      const sgpa =
        Number(semester.semester_summary?.sgpa) ||
        (semesterCreditHours > 0
          ? Number((semesterPoints / semesterCreditHours).toFixed(2))
          : 0);

      const cumulativeCreditHours =
        Number(semester.cumulative_summary?.credit_hours) ||
        Number(semesterCreditHours);

      const cumulativePoints =
        Number(semester.cumulative_summary?.points) || Number(semesterPoints);

      const cgpa =
        Number(semester.cumulative_summary?.cgpa) ||
        (cumulativeCreditHours > 0
          ? Number((cumulativePoints / cumulativeCreditHours).toFixed(2))
          : 0);

      return {
        academic_year: String(semester.academic_year || "").trim(),
        semester: String(semester.semester || "").trim(),
        year_level: semester.year_level
          ? String(semester.year_level).trim()
          : null,
        courses,
        semester_summary: {
          credit_hours: Number(semesterCreditHours.toFixed(2)),
          points: Number(semesterPoints.toFixed(2)),
          sgpa: Number(sgpa.toFixed(2)),
          academic_status: semester.semester_summary?.academic_status || null,
        },
        cumulative_summary: {
          credit_hours: Number(cumulativeCreditHours.toFixed(2)),
          points: Number(cumulativePoints.toFixed(2)),
          cgpa: Number(cgpa.toFixed(2)),
        },
      };
    })
    .filter(
      (semester) =>
        semester.academic_year &&
        semester.semester &&
        semester.courses.length > 0 &&
        Number.isFinite(semester.semester_summary.sgpa) &&
        Number.isFinite(semester.cumulative_summary.cgpa),
    );
}

function groupCoursesBySemester(courses) {
  return courses.reduce((groups, course) => {
    const semester = course.semester || "First Semester";
    if (!groups[semester]) {
      groups[semester] = [];
    }
    groups[semester].push(course);
    return groups;
  }, {});
}

async function recommendTranscriptConfig(transcriptPayload) {
  return apiFetch(TRANSCRIPT_RECOMMEND_API_URL, {
    method: "POST",
    body: transcriptPayload,
  });
}

async function uploadTranscript(transcriptPayload) {
  return apiFetch(TRANSCRIPT_API_URL, {
    method: "POST",
    body: transcriptPayload,
  });
}

async function getLatestTranscript() {
  return apiFetch(TRANSCRIPT_LATEST_API_URL, { method: "GET" });
}

async function loadTranscriptConfig(showToast) {
  try {
    const config = await apiFetch(TRANSCRIPT_CONFIG_API_URL, { method: "GET" });
    transcriptConfig = {
      gpa_scale: config.gpa_scale,
      grading_schema: config.grading_schema,
      grade_display_order: config.grade_display_order,
    };
    renderTranscriptConfigForm(transcriptConfig);
    window.chrome.storage.local.set({ transcriptConfig });
    if (showToast)
      setTranscriptConfigStatus(
        "Loaded transcript config from backend.",
        "success",
      );
  } catch (error) {
    if (!transcriptConfig) {
      transcriptConfig = { ...DEFAULT_TRANSCRIPT_CONFIG };
      renderTranscriptConfigForm(transcriptConfig);
    }
    if (showToast) {
      setTranscriptConfigStatus(
        error.message || "Unable to load transcript config.",
        "error",
      );
    }
  }
}

async function loadTranscriptPresets(showToast) {
  try {
    const response = await apiFetch(TRANSCRIPT_CONFIG_PRESETS_API_URL, {
      method: "GET",
      requireAuth: false,
    });
    gradingPresets = response?.presets || [];
    renderPresets(gradingPresets);
    if (showToast)
      setTranscriptConfigStatus(
        `Loaded ${gradingPresets.length} presets.`,
        "success",
      );
  } catch (error) {
    if (showToast) {
      setTranscriptConfigStatus(
        error.message || "Unable to load presets.",
        "error",
      );
    }
  }
}

function renderPresets(presets) {
  const presetSelect = document.getElementById("gradingPresetSelect");
  if (!presetSelect) return;

  if (!presets || presets.length === 0) {
    presetSelect.innerHTML = '<option value="">No presets loaded</option>';
    return;
  }

  presetSelect.innerHTML = presets
    .map(
      (preset, index) =>
        `<option value="${index}">${preset.name} - ${preset.description}</option>`,
    )
    .join("");
}

function renderTranscriptConfigForm(config) {
  if (!config) return;

  const gpaScaleInput = document.getElementById("gpaScaleInput");
  const gradingSchemaInput = document.getElementById("gradingSchemaInput");
  const gradeDisplayOrderInput = document.getElementById(
    "gradeDisplayOrderInput",
  );

  if (gpaScaleInput) gpaScaleInput.value = config.gpa_scale;
  if (gradingSchemaInput)
    gradingSchemaInput.value = JSON.stringify(config.grading_schema, null, 2);
  if (gradeDisplayOrderInput)
    gradeDisplayOrderInput.value = (config.grade_display_order || []).join(
      ", ",
    );
}

function readTranscriptConfigFromForm() {
  const gpaScaleInput = document.getElementById("gpaScaleInput");
  const gradingSchemaInput = document.getElementById("gradingSchemaInput");
  const gradeDisplayOrderInput = document.getElementById(
    "gradeDisplayOrderInput",
  );

  const gpaScale = Number(gpaScaleInput?.value || 0);
  if (!Number.isFinite(gpaScale) || gpaScale <= 0 || gpaScale > 100) {
    throw new Error("GPA scale must be a number between 0 and 100.");
  }

  let gradingSchema;
  try {
    gradingSchema = JSON.parse(gradingSchemaInput?.value || "{}");
  } catch (_error) {
    throw new Error("Grading schema must be valid JSON.");
  }

  const gradeDisplayOrder = (gradeDisplayOrderInput?.value || "")
    .split(",")
    .map((grade) => grade.trim())
    .filter(Boolean);

  if (gradeDisplayOrder.length === 0) {
    throw new Error("Grade display order cannot be empty.");
  }

  return {
    gpa_scale: gpaScale,
    grading_schema: gradingSchema,
    grade_display_order: gradeDisplayOrder,
  };
}

async function handleSaveTranscriptConfig() {
  try {
    const payload = readTranscriptConfigFromForm();
    const saved = await apiFetch(TRANSCRIPT_CONFIG_API_URL, {
      method: "PUT",
      body: payload,
    });

    transcriptConfig = {
      gpa_scale: saved.gpa_scale,
      grading_schema: saved.grading_schema,
      grade_display_order: saved.grade_display_order,
    };

    window.chrome.storage.local.set({ transcriptConfig });
    setTranscriptConfigStatus("Transcript config saved to backend.", "success");
  } catch (error) {
    setTranscriptConfigStatus(
      error.message || "Unable to save transcript config.",
      "error",
    );
  }
}

async function handleResetTranscriptConfig() {
  try {
    await apiFetch(TRANSCRIPT_CONFIG_API_URL, {
      method: "DELETE",
    });
    await loadTranscriptConfig(false);
    setTranscriptConfigStatus(
      "Transcript config reset to backend defaults.",
      "success",
    );
  } catch (error) {
    setTranscriptConfigStatus(
      error.message || "Unable to reset config.",
      "error",
    );
  }
}

function handleApplyPreset() {
  const presetSelect = document.getElementById("gradingPresetSelect");
  const index = Number(presetSelect?.value);

  if (!Number.isFinite(index) || !gradingPresets[index]) {
    setTranscriptConfigStatus("Select a preset before applying.", "error");
    return;
  }

  const preset = gradingPresets[index];
  transcriptConfig = {
    gpa_scale: preset.gpa_scale,
    grading_schema: preset.grading_schema,
    grade_display_order: preset.grade_display_order,
  };
  renderTranscriptConfigForm(transcriptConfig);
  setTranscriptConfigStatus(
    `Applied preset: ${preset.name}. Click Save Config to persist.`,
    "success",
  );
}

async function handleRecommendConfig() {
  try {
    const payload = buildTranscriptCreatePayload(
      syncedData || getMockSyncData(),
    );
    const recommendation = await recommendTranscriptConfig(payload);

    if (recommendation?.suggested_config) {
      transcriptConfig = {
        gpa_scale: recommendation.suggested_config.gpa_scale,
        grading_schema: recommendation.suggested_config.grading_schema,
        grade_display_order:
          recommendation.suggested_config.grade_display_order,
      };
      renderTranscriptConfigForm(transcriptConfig);
    }

    setTranscriptConfigStatus(
      `Recommended preset: ${recommendation.recommended_preset} (${recommendation.confidence}).`,
      "success",
    );
  } catch (error) {
    setTranscriptConfigStatus(
      error.message || "Unable to get recommendation.",
      "error",
    );
  }
}

function setTranscriptConfigStatus(message, type) {
  const statusEl = document.getElementById("transcriptConfigStatus");
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.classList.remove("status-success", "status-error");
  if (type === "success") statusEl.classList.add("status-success");
  if (type === "error") statusEl.classList.add("status-error");
}

async function apiFetch(url, options = {}) {
  const method = options.method || "GET";
  const requireAuth = options.requireAuth !== false;

  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(requireAuth ? getAuthHeader() : {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.detail;
    if (Array.isArray(detail) && detail.length > 0) {
      throw new Error(
        detail.map((entry) => entry.msg || entry.message).join(", "),
      );
    }
    throw new Error(
      payload?.message ||
        payload?.detail ||
        `Request failed (${response.status}).`,
    );
  }

  return payload;
}

function getAuthHeader() {
  const token = currentUser?.token;
  if (!token) {
    throw new Error("Missing access token. Please login again.");
  }
  return { Authorization: `Bearer ${token}` };
}

function updateActivityList(state, data) {
  const activityList = document.getElementById("activityList");

  if (!activityList) return;

  if (state === "success") {
    activityList.innerHTML = `
      <div class="activity-item active">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Transcript Upload Complete</div>
          <div class="activity-description">Uploaded ${data.courses} courses${data.preset ? ` using ${data.preset}` : ""}</div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Backend Sync Successful</div>
          <div class="activity-description">Config recommendation and upload completed</div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Transcript Scrape Prepared</div>
        </div>
      </div>
    `;
  } else if (state === "progress") {
    activityList.innerHTML = `
      <div class="activity-item active">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">${data}</div>
          <div class="activity-progress">
            <div class="activity-progress-bar" style="width: 75%;"></div>
          </div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Ready to process</div>
          <div class="activity-description">Scraped transcript is queued for backend sync</div>
        </div>
      </div>
    `;
  } else if (state === "error") {
    activityList.innerHTML = `
      <div class="activity-item" style="opacity: 0.5;">
        <div class="activity-dot" style="background: #ef4444;"></div>
        <div class="activity-content">
          <div class="activity-title">Sync Failed</div>
          <div class="activity-description">${data}</div>
        </div>
      </div>
    `;
  }
}

function handleClearData() {
  if (confirm("This will clear all cached academic data. Continue?")) {
    window.chrome.storage.local.remove(["syncedData"], () => {
      syncedData = null;
      alert("Cache cleared successfully");
      displaySyncedData();
    });
  }
}

function handleToggleChange(e) {
  const setting = e.target.id;
  const value = e.target.checked;
  window.chrome.storage.local.set({ [setting]: value });
}

function updateDashboard() {
  if (!currentUser) return;

  document.getElementById("userName").textContent = currentUser.name;
  document.getElementById("userEmail").textContent = currentUser.email;
  document.getElementById("userInitials").textContent = getInitials(
    currentUser.name,
  );

  if (syncedData) {
    displaySyncedData();
  }
}

function displaySyncedData() {
  const personalData = document.getElementById("personalData");
  const coursesData = document.getElementById("coursesData");
  const progressData = document.getElementById("progressData");

  if (!syncedData) {
    if (personalData)
      personalData.innerHTML = '<p class="empty-state">No synced data yet.</p>';
    if (coursesData)
      coursesData.innerHTML =
        '<p class="empty-state">No course data available.</p>';
    if (progressData)
      progressData.innerHTML =
        '<p class="empty-state">No progress data available.</p>';
    return;
  }

  if (personalData) {
    personalData.innerHTML = `
      <div class="data-item">
        <span class="data-label">Student ID</span>
        <span class="data-value">${syncedData.studentId || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Department</span>
        <span class="data-value">${syncedData.department || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Year</span>
        <span class="data-value">${syncedData.year || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Status</span>
        <span class="data-value">${syncedData.status || "N/A"}</span>
      </div>
    `;
  }

  if (coursesData) {
    if (syncedData.courses && syncedData.courses.length > 0) {
      coursesData.innerHTML = syncedData.courses
        .map(
          (course) => `
        <div class="course-item">
          <div class="course-header">
            <span class="course-name">${course.name || course.title}</span>
            <span class="course-grade">${course.grade}</span>
          </div>
          <div class="course-code">${course.code} • ${course.credits} Credits</div>
        </div>
      `,
        )
        .join("");
    } else {
      coursesData.innerHTML =
        '<p class="empty-state">No course data available</p>';
    }
  }

  if (progressData) {
    const completion =
      syncedData.degreeProgress?.completionPercentage ||
      syncedData.completion ||
      0;

    progressData.innerHTML = `
      <div class="data-item">
        <span class="data-label">GPA</span>
        <span class="data-value">${syncedData.gpa || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Credits Earned</span>
        <span class="data-value">${syncedData.degreeProgress?.creditsEarned || syncedData.creditsEarned || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Total Credits</span>
        <span class="data-value">${syncedData.degreeProgress?.totalCreditsRequired || syncedData.totalCredits || "N/A"}</span>
      </div>
      <div class="data-item">
        <span class="data-label">Completion</span>
        <span class="data-value">${completion}%</span>
      </div>
    `;
  }
}

function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden");
  });

  const targetScreen = document.getElementById(`${screenName}Screen`);
  if (targetScreen) {
    targetScreen.classList.remove("hidden");
  }

  if (screenName === "data") {
    displaySyncedData();
  }

  if (screenName === "transcriptConfig") {
    renderTranscriptConfigForm(transcriptConfig || DEFAULT_TRANSCRIPT_CONFIG);
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
