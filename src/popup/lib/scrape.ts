import type { AcademicData } from "./types";

const SCRAPE_LOG_PREFIX = "[Transcript Scrape]";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function extractFromActiveTab(): Promise<AcademicData> {
  const startedAt = Date.now();
  console.log(`${SCRAPE_LOG_PREFIX} extract:start`);

  const chrome = globalThis.chrome;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log(`${SCRAPE_LOG_PREFIX} activeTab:resolved`, {
    tabId: tab?.id,
    url: tab?.url,
  });

  if (!tab?.id) throw new Error("Unable to detect active browser tab.");

  try {
    console.log(`${SCRAPE_LOG_PREFIX} contentScript:inject:start`, {
      tabId: tab.id,
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    console.log(`${SCRAPE_LOG_PREFIX} contentScript:inject:success`, {
      tabId: tab.id,
    });
  } catch {
    console.log(`${SCRAPE_LOG_PREFIX} contentScript:inject:skipped`, {
      tabId: tab.id,
      note: "May already be injected",
    });
  }

  const tabUrl = String(tab.url || "");
  const isAStuFromUrl = tabUrl.includes("estudent.astu.edu.et");
  console.log(`${SCRAPE_LOG_PREFIX} portal:check:url`, {
    isAStuFromUrl,
    tabUrl,
  });

  const portalCheck = await sendTabMessageWithRetry(
    tab.id,
    { action: "checkPortal" },
    3,
  ).catch(() => null);
  console.log(`${SCRAPE_LOG_PREFIX} portal:check:message`, { portalCheck });

  if (!isAStuFromUrl && !portalCheck?.isASTU) {
    throw new Error(
      "Open ASTU e-Student Academic History page before syncing.",
    );
  }

  console.log(`${SCRAPE_LOG_PREFIX} scrape:request:start`, { tabId: tab.id });
  const scrapeResult = await sendTabMessageWithRetry(
    tab.id,
    { action: "scrapeAcademicData" },
    3,
  );
  console.log(`${SCRAPE_LOG_PREFIX} scrape:request:response`, {
    success: scrapeResult?.success,
    error: scrapeResult?.error,
    hasData: Boolean(scrapeResult?.data),
    elapsedMs: Date.now() - startedAt,
  });

  if (!scrapeResult?.success || !scrapeResult?.data) {
    throw new Error(
      scrapeResult?.error || "Failed to scrape ASTU transcript data.",
    );
  }

  console.log(`${SCRAPE_LOG_PREFIX} extract:success`, {
    elapsedMs: Date.now() - startedAt,
    studentId: scrapeResult?.data?.studentId,
    courseCount: scrapeResult?.data?.courses?.length || 0,
    semesterCount: scrapeResult?.data?.transcriptData?.semesters?.length || 0,
  });

  return scrapeResult.data as AcademicData;
}

async function sendTabMessageWithRetry(
  tabId: number,
  message: any,
  maxAttempts = 3,
): Promise<any> {
  const chrome = globalThis.chrome;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      console.log(`${SCRAPE_LOG_PREFIX} tabMessage:attempt`, {
        tabId,
        action: message?.action,
        attempt,
        maxAttempts,
      });
      const response = await new Promise<any>((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(result);
          }
        });
      });
      console.log(`${SCRAPE_LOG_PREFIX} tabMessage:success`, {
        tabId,
        action: message?.action,
        attempt,
      });
      return response;
    } catch (e: any) {
      lastError = e;
      console.warn(`${SCRAPE_LOG_PREFIX} tabMessage:error`, {
        tabId,
        action: message?.action,
        attempt,
        message: e?.message,
      });
      if (attempt < maxAttempts) await sleep(180);
    }
  }

  console.error(`${SCRAPE_LOG_PREFIX} tabMessage:failed`, {
    tabId,
    action: message?.action,
    maxAttempts,
    error: lastError,
  });
  throw lastError || new Error("Failed to communicate with active tab.");
}
