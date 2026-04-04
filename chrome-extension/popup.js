// State management
let currentUser = null
let syncedData = null
let userConsent = false
let pendingSyncData = null

// Initialize
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserSession()
  initializeEventListeners()
})

// Load user session from storage
async function loadUserSession() {
  window.chrome.storage.local.get(["user", "syncedData", "userConsent"], (result) => {
    if (result.user) {
      currentUser = result.user
      syncedData = result.syncedData || null
      userConsent = result.userConsent || false
      showScreen("dashboard")
      updateDashboard()
    } else {
      showScreen("login")
    }
  })
}

// Event Listeners
function initializeEventListeners() {
  // Login
  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Dashboard
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)
  document.getElementById("syncBtn").addEventListener("click", handleSync)

  // Data View
  document.getElementById("backFromData").addEventListener("click", () => showScreen("dashboard"))

  // Settings
  document.getElementById("backFromSettings").addEventListener("click", () => showScreen("dashboard"))
  document.getElementById("clearDataBtn").addEventListener("click", handleClearData)
  document.getElementById("autoSyncToggle").addEventListener("change", handleToggleChange)
  document.getElementById("notificationsToggle").addEventListener("change", handleToggleChange)

  // Consent Modal
  document.getElementById("acceptConsentBtn").addEventListener("click", handleAcceptConsent)
  document.getElementById("declineConsentBtn").addEventListener("click", handleDeclineConsent)
  document.getElementById("closeConsentBtn").addEventListener("click", closeConsentModal)
}

// Show/Hide Consent Modal
function showConsentModal() {
  document.getElementById("consentOverlay").classList.remove("hidden")
}

function closeConsentModal() {
  document.getElementById("consentOverlay").classList.add("hidden")
}

function handleAcceptConsent() {
  userConsent = true
  window.chrome.storage.local.set({ userConsent: true })
  closeConsentModal()

  // Continue with sync
  if (pendingSyncData) {
    processSyncData(pendingSyncData)
    pendingSyncData = null
  }
}

function handleDeclineConsent() {
  closeConsentModal()
  pendingSyncData = null
  alert("Sync declined. No data was extracted or stored.")
}

// ============================================
// MOCK BACKEND API SERVICE
// ============================================
const MockBackendAPI = {
  baseDelay: 500, // Simulate network latency

  // Authenticate user
  async authenticate(email, password) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          token: "mock_token_" + Date.now(),
          user: {
            id: "user_" + Math.random().toString(36).substr(2, 9),
            email: email,
            name: this.extractName(email),
          },
        })
      }, this.baseDelay)
    })
  },

  // Sync academic data
  async syncAcademicData(data, userID) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: "Data synced successfully",
          syncID: "sync_" + Date.now(),
          timestamp: new Date().toISOString(),
          dataReceived: {
            studentId: data.studentId,
            courses: data.courses?.length || 0,
            gpa: data.gpa,
          },
        })
      }, this.baseDelay + 300)
    })
  },

  // Fetch user profile
  async fetchUserProfile(userID) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          profile: {
            id: userID,
            name: "Student Name",
            email: "student@astu.edu.et",
            department: "Engineering",
            accountCreated: "2023-01-15",
          },
        })
      }, this.baseDelay)
    })
  },

  // Get transcript
  async getTranscript(userID) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transcript: {
            totalCourses: 18,
            completedCourses: 16,
            gpa: "3.78",
            academicStanding: "Good Standing",
          },
        })
      }, this.baseDelay)
    })
  },

  // Get degree progress
  async getDegreeProgress(userID) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          progress: {
            creditsEarned: 90,
            totalCreditsRequired: 120,
            completionPercentage: 75,
            expectedGraduation: "May 2025",
          },
        })
      }, this.baseDelay)
    })
  },

  // Helper
  extractName(email) {
    const name = email.split("@")[0]
    return name
      .split(".")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  },
}

// ============================================

// Handle Login
async function handleLogin(e) {
  e.preventDefault()

  const email = document.getElementById("email").value
  const password = document.getElementById("password").value
  const loginBtn = document.getElementById("loginBtn")

  // Show loading state
  loginBtn.innerHTML = "<span>Signing in...</span>"
  loginBtn.disabled = true

  // Call mock backend API
  const authResult = await MockBackendAPI.authenticate(email, password)

  if (authResult.success) {
    currentUser = authResult.user
    currentUser.loginTime = new Date().toISOString()

    // Save to storage
    window.chrome.storage.local.set({ user: currentUser }, () => {
      showScreen("dashboard")
      updateDashboard()
      loginBtn.innerHTML = "<span>Sign In</span>"
      loginBtn.disabled = false
    })
  } else {
    alert("Login failed. Please try again.")
    loginBtn.innerHTML = "<span>Sign In</span>"
    loginBtn.disabled = false
  }
}

// Handle Logout
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    window.chrome.storage.local.remove(["user", "syncedData", "userConsent"], () => {
      currentUser = null
      syncedData = null
      userConsent = false
      showScreen("login")
      document.getElementById("loginForm").reset()
    })
  }
}

// Handle Sync
async function handleSync() {
  // Show consent modal first
  showConsentModal()

  // Prepare for sync but wait for consent
  const syncBtn = document.getElementById("syncBtn")
  syncBtn.disabled = true

  try {
    const [tab] = await window.chrome.tabs.query({ active: true, currentWindow: true })

    try {
      await window.chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      })
      await new Promise((resolve) => setTimeout(resolve, 100))
    } catch (injectError) {
      console.log("[v0] Script injection note:", injectError.message)
    }

    // Check if we're on ASTU portal
    const portalCheck = await new Promise((resolve) => {
      window.chrome.tabs.sendMessage(
        tab.id,
        { action: "checkPortal" },
        (response) => {
          if (window.chrome.runtime.lastError) {
            resolve({ isASTU: false })
          } else {
            resolve(response)
          }
        }
      )
    })

    if (!portalCheck.isASTU) {
      closeConsentModal()
      alert("Please navigate to ASTU e-Student portal (https://estudent.astu.edu.et/)")
      syncBtn.disabled = false
      return
    }

    // Now scrape data
    const response = await new Promise((resolve, reject) => {
      window.chrome.tabs.sendMessage(tab.id, { action: "scrapeAcademicData" }, (response) => {
        if (window.chrome.runtime.lastError) {
          reject(new Error(window.chrome.runtime.lastError.message))
        } else {
          resolve(response)
        }
      })
    })

    if (response && response.success) {
      pendingSyncData = response.data
      // Consent modal will trigger the actual sync on acceptance
    } else {
      throw new Error(response?.error || "Failed to scrape data")
    }
  } catch (error) {
    closeConsentModal()
    let errorMessage = "Unable to sync. Please try reloading the page and try again."

    if (error.message.includes("Receiving end does not exist")) {
      errorMessage = "Connection failed. Please reload the current page and try again."
    } else if (error.message.includes("Cannot access")) {
      errorMessage = "Cannot access this page. Try navigating to ASTU portal first."
    }

    updateActivityList("error", errorMessage)
    syncBtn.disabled = false

    setTimeout(() => {
      updateActivityList("reset")
    }, 3000)
  }
}

// Process sync data after consent
async function processSyncData(data) {
  const syncBtn = document.getElementById("syncBtn")

  try {
    // Call mock backend API to store data
    const apiResult = await MockBackendAPI.syncAcademicData(data, currentUser.id)

    if (apiResult.success) {
      syncedData = data
      syncedData.syncTime = new Date().toISOString()
      syncedData.backendSyncID = apiResult.syncID

      window.chrome.storage.local.set({ syncedData }, () => {
        updateActivityList("success", data.courses?.length || 0)
        updateDashboard()

        // Fetch additional data from backend
        fetchAdditionalData()

        setTimeout(() => {
          syncBtn.disabled = false
        }, 2000)
      })
    } else {
      throw new Error("Backend sync failed")
    }
  } catch (error) {
    updateActivityList("error", "Failed to save data to backend")
    syncBtn.disabled = false

    setTimeout(() => {
      updateActivityList("reset")
    }, 3000)
  }
}

// Fetch additional data from mock backend
async function fetchAdditionalData() {
  try {
    const transcript = await MockBackendAPI.getTranscript(currentUser.id)
    const progress = await MockBackendAPI.getDegreeProgress(currentUser.id)

    if (transcript.success && progress.success) {
      if (syncedData) {
        syncedData.transcript = transcript.transcript
        syncedData.degreeProgress = progress.progress

        window.chrome.storage.local.set({ syncedData })
      }
    }
  } catch (error) {
    console.error("[v0] Failed to fetch additional data:", error)
  }
}

// Update Activity List
function updateActivityList(state, data) {
  const activityList = document.getElementById("activityList")

  if (state === "success") {
    activityList.innerHTML = `
      <div class="activity-item active">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Data Sync Complete</div>
          <div class="activity-description">Successfully synced ${data} courses</div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Validated Credentials</div>
          <div class="activity-description">ASTU Portal Authenticated</div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Connection Established</div>
        </div>
      </div>
    `
  } else if (state === "error") {
    activityList.innerHTML = `
      <div class="activity-item" style="opacity: 0.5;">
        <div class="activity-dot" style="background: #ef4444;"></div>
        <div class="activity-content">
          <div class="activity-title">Sync Failed</div>
          <div class="activity-description">${data}</div>
        </div>
      </div>
    `
  } else if (state === "reset") {
    activityList.innerHTML = `
      <div class="activity-item active">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Extracting Semester 4...</div>
          <div class="activity-progress">
            <div class="activity-progress-bar" style="width: 65%;"></div>
          </div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Validated Credentials</div>
          <div class="activity-description">University Auth Gateway Approved</div>
        </div>
      </div>
      <div class="activity-item completed">
        <div class="activity-dot"></div>
        <div class="activity-content">
          <div class="activity-title">Connection Established</div>
        </div>
      </div>
    `
  }
}

// Handle Clear Data
function handleClearData() {
  if (confirm("This will clear all cached academic data. Continue?")) {
    window.chrome.storage.local.remove(["syncedData"], () => {
      syncedData = null
      alert("Cache cleared successfully")
    })
  }
}

// Handle Toggle Changes
function handleToggleChange(e) {
  const setting = e.target.id
  const value = e.target.checked
  window.chrome.storage.local.set({ [setting]: value })
}

// Update Dashboard
function updateDashboard() {
  if (!currentUser) return

  // Update user info
  document.getElementById("userName").textContent = currentUser.name
  document.getElementById("userEmail").textContent = currentUser.email
  document.getElementById("userInitials").textContent = getInitials(currentUser.name)

  // Load and display synced data if available
  window.chrome.storage.local.get(["syncedData"], (result) => {
    if (result.syncedData) {
      syncedData = result.syncedData
      displaySyncedData()
    }
  })
}

// Display Synced Data
function displaySyncedData() {
  if (!syncedData) return

  // Personal Data
  const personalData = document.getElementById("personalData")
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
    `
  }

  // Courses Data
  const coursesData = document.getElementById("coursesData")
  if (coursesData) {
    if (syncedData.courses && syncedData.courses.length > 0) {
      coursesData.innerHTML = syncedData.courses
        .map(
          (course) => `
        <div class="course-item">
          <div class="course-header">
            <span class="course-name">${course.name}</span>
            <span class="course-grade">${course.grade}</span>
          </div>
          <div class="course-code">${course.code} • ${course.credits} Credits</div>
        </div>
      `,
        )
        .join("")
    } else {
      coursesData.innerHTML = '<p class="empty-state">No course data available</p>'
    }
  }

  // Progress Data with transcript and degree progress
  const progressData = document.getElementById("progressData")
  if (progressData) {
    let completion = syncedData.completion || 0

    // If we have degree progress from API, use that
    if (syncedData.degreeProgress) {
      completion = syncedData.degreeProgress.completionPercentage
    }

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
    `
  }
}

// Screen Navigation
function showScreen(screenName) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.add("hidden")
  })

  const targetScreen = document.getElementById(`${screenName}Screen`)
  if (targetScreen) {
    targetScreen.classList.remove("hidden")
  }

  // Display synced data when navigating to data screen
  if (screenName === "data" && syncedData) {
    displaySyncedData()
  }
}

// Helper Functions
function extractNameFromEmail(email) {
  const name = email.split("@")[0]
  return name
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function generateUserId() {
  return "user_" + Math.random().toString(36).substr(2, 9)
}

function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}
