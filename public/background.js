// Background service worker for VentureScope extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("VentureScope Extension installed");

  // Set default settings
  chrome.storage.local.set({
    autoSyncToggle: false,
    notificationsToggle: true,
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "syncComplete") {
    // Show notification if enabled
    chrome.storage.local.get(["notificationsToggle"], (result) => {
      if (result.notificationsToggle) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.svg",
          title: "VentureScope Sync Complete",
          message: "Your academic data has been successfully synced!",
          priority: 2,
        });
      }
    });
  }
});

// Auto-sync functionality
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    chrome.storage.local.get(["autoSyncToggle", "user"], (result) => {
      if (result.autoSyncToggle && result.user) {
        // Check if it's a student portal
        const url = tab.url || "";
        const keywords = [
          "student",
          "portal",
          "academic",
          "university",
          "college",
        ];

        if (keywords.some((keyword) => url.includes(keyword))) {
          // Could trigger auto-sync here
          console.log("Student portal detected, auto-sync enabled");
        }
      }
    });
  }
});

