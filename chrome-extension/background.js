// Background service worker for VentureScope extension

// Declare the chrome variable
const chrome = window.chrome

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("VentureScope Extension installed")

  // Set default settings
  chrome.storage.local.set({
    autoSyncToggle: false,
    notificationsToggle: true,
    apiEndpoint: "https://api.venturescope.com",
  })
})

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "syncComplete") {
    // Show notification if enabled
    chrome.storage.local.get(["notificationsToggle"], (result) => {
      if (result.notificationsToggle) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "VentureScope Sync Complete",
          message: "Your academic data has been successfully synced!",
          priority: 2,
        })
      }
    })
  }

  if (request.action === "sendToBackend") {
    // Send data to VentureScope backend
    sendDataToBackend(request.data)
      .then((response) => {
        sendResponse({ success: true, response })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true // Keep channel open for async response
  }
})

// Function to send data to VentureScope backend
async function sendDataToBackend(data) {
  const settings = await chrome.storage.local.get(["apiEndpoint", "user"])
  const endpoint = settings.apiEndpoint || "https://api.venturescope.com"

  // When backend is ready, this will make actual API call
  // For now, just simulate success
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: "success", message: "Data synced to VentureScope" })
    }, 1000)
  })

  /* Uncomment when backend is ready:
  const response = await fetch(`${endpoint}/api/academic-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.user?.token}`
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error('Failed to sync data to backend');
  }
  
  return await response.json();
  */
}

// Auto-sync functionality
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    chrome.storage.local.get(["autoSyncToggle", "user"], (result) => {
      if (result.autoSyncToggle && result.user) {
        // Check if it's a student portal
        const url = tab.url || ""
        const keywords = ["student", "portal", "academic", "university", "college"]

        if (keywords.some((keyword) => url.includes(keyword))) {
          // Could trigger auto-sync here
          console.log("Student portal detected, auto-sync enabled")
        }
      }
    })
  }
})
