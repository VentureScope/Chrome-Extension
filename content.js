// Content script for scraping academic data from ASTU eStudent portal

var extensionApi = globalThis.chrome;

console.log("[VentureScope] Content script loaded on:", window.location.href);

if (!extensionApi?.runtime?.onMessage) {
  console.error(
    "[VentureScope] Extension runtime API unavailable in content script context.",
  );
} else {
  extensionApi.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
      console.log(
        "[VentureScope] Content script received message:",
        request.action,
      );

      if (request.action === "scrapeAcademicData") {
        try {
          const isAStu = window.location.hostname.includes(
            "estudent.astu.edu.et",
          );
          const data = isAStu ? scrapeASTUData() : scrapePageData();
          sendResponse({ success: true, data });
        } catch (error) {
          console.error("[VentureScope] Error scraping data:", error);
          sendResponse({ success: false, error: error.message });
        }
        return true;
      }

      if (request.action === "checkPortal") {
        const isAStu = window.location.hostname.includes(
          "estudent.astu.edu.et",
        );
        sendResponse({ isASTU: isAStu, hostname: window.location.hostname });
        return true;
      }

      if (request.action === "ping") {
        sendResponse({ alive: true, href: window.location.href });
        return true;
      }

      return false;
    },
  );
}

function scrapeASTUData() {
  const profile = extractProfileInfo();
  const transcriptExtraction = extractTranscriptTabData();
  const gpaSummary = extractGpaSummary();

  const transcriptData = {
    student_id: profile.studentId || null,
    semesters: transcriptExtraction.uploadableSemesters,
  };

  const allCourses = transcriptExtraction.allSemesters.flatMap((semester) =>
    semester.courses.map((course) => ({
      code: course.code,
      name: course.title,
      grade: course.grade,
      credits: course.credit_hours,
      points: course.points,
      semester: semester.semester,
      academicYear: semester.academic_year,
      yearLevel: semester.year_level,
    })),
  );

  const latestCumulative = transcriptExtraction.uploadableSemesters.length
    ? transcriptExtraction.uploadableSemesters[
        transcriptExtraction.uploadableSemesters.length - 1
      ].cumulative_summary
    : null;

  const academicData = {
    studentId: profile.studentId || null,
    name: profile.name,
    email: profile.email,
    department: profile.department,
    year: profile.year,
    status:
      gpaSummary.academicStatus ||
      transcriptExtraction.latestAcademicStatus ||
      "Unknown",
    gpa:
      gpaSummary.cumulativeGpa ||
      (latestCumulative ? String(latestCumulative.cgpa) : null),
    courses: allCourses,
    transcriptData,
    transcript: {
      totalCourses: allCourses.length,
      completedCourses: allCourses.filter(
        (course) => course.grade && course.grade !== "-",
      ).length,
      inProgressCourses: allCourses.filter((course) => course.grade === "-")
        .length,
      failedCourses: allCourses.filter((course) => course.grade === "F").length,
      retakenCourses: 0,
      academicStanding:
        gpaSummary.academicStatus ||
        transcriptExtraction.latestAcademicStatus ||
        "Unknown",
      warningsOrProbation: null,
    },
    degreeProgress: {
      creditsEarned: latestCumulative ? latestCumulative.credit_hours : null,
      totalCreditsRequired: latestCumulative
        ? latestCumulative.credit_hours
        : null,
      completionPercentage: latestCumulative ? 100 : null,
      remainingCredits: 0,
      expectedGraduation: null,
    },
    pendingSemesters: transcriptExtraction.pendingSemesters,
    extractedFrom: "ASTU eStudent Portal",
    extractedAt: new Date().toISOString(),
  };

  if (!academicData.transcriptData.semesters.length) {
    throw new Error("No transcript semesters found for backend upload.");
  }

  return academicData;
}

function extractProfileInfo() {
  const profileContainer = document.querySelector(".dropdown-item .media-body");
  const nameText =
    cleanText(
      profileContainer?.querySelector(".dropdown-item-title")?.childNodes?.[0]
        ?.textContent,
    ) ||
    cleanText(document.querySelector(".dropdown-item-title")?.textContent) ||
    "Unknown Student";

  const departmentText =
    cleanText(profileContainer?.querySelector(".text-sm")?.textContent) ||
    extractByPattern(
      document.body.innerText,
      /(?:Department|Program)\s*[:\-]\s*([^\n]+)/i,
    ) ||
    null;

  const yearText =
    cleanText(profileContainer?.querySelector(".text-muted")?.textContent) ||
    extractByPattern(
      document.body.innerText,
      /(First|Second|Third|Fourth|Fifth|Sixth)\s+Year/i,
    ) ||
    null;

  const studentId =
    extractByPattern(
      document.body.innerText,
      /(?:Student\s*ID|Registration\s*No|ID\s*No)\s*[:\-]\s*([A-Za-z0-9\/-]+)/i,
    ) || null;

  const email =
    extractByPattern(
      document.body.innerText,
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    ) || null;

  return {
    name: nameText,
    department: departmentText,
    year: yearText,
    studentId,
    email,
  };
}

function extractTranscriptTabData() {
  const transcriptTab = document.querySelector("#transcript");
  const semesterBlocks = transcriptTab
    ? Array.from(transcriptTab.querySelectorAll(".mb-4"))
    : [];

  const allSemesters = semesterBlocks
    .map((block) => parseSemesterBlock(block))
    .filter(Boolean);

  const uploadableSemesters = allSemesters.filter(
    (semester) =>
      semester.courses.length > 0 &&
      Number.isFinite(semester.semester_summary.sgpa) &&
      Number.isFinite(semester.cumulative_summary.cgpa),
  );

  const pendingSemesters = allSemesters
    .filter(
      (semester) =>
        !Number.isFinite(semester.semester_summary.sgpa) ||
        !Number.isFinite(semester.cumulative_summary.cgpa),
    )
    .map((semester) => ({
      academic_year: semester.academic_year,
      semester: semester.semester,
      year_level: semester.year_level,
      courses: semester.courses,
    }));

  const latestAcademicStatus =
    allSemesters.length > 0
      ? allSemesters[allSemesters.length - 1].semester_summary.academic_status
      : null;

  return {
    allSemesters,
    uploadableSemesters,
    pendingSemesters,
    latestAcademicStatus,
  };
}

function parseSemesterBlock(block) {
  const heading = cleanText(block.querySelector("h6")?.textContent);
  const headingParts = parseSemesterHeading(heading);
  if (!headingParts) {
    return null;
  }

  const table = block.querySelector("table");
  if (!table) {
    return null;
  }

  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const courses = bodyRows.map((row) => parseCourseRow(row)).filter(Boolean);

  const footerInfo = parseFooter(table.querySelector("tfoot"));

  const calculatedCreditHours = courses.reduce(
    (sum, course) => sum + Number(course.credit_hours || 0),
    0,
  );
  const calculatedPoints = courses.reduce(
    (sum, course) => sum + Number(course.points || 0),
    0,
  );

  const semesterCreditHours =
    footerInfo.semesterCreditHours ?? calculatedCreditHours;
  const semesterPoints = footerInfo.semesterPoints ?? calculatedPoints;
  const semesterSgpa =
    footerInfo.semesterSgpa ??
    (semesterCreditHours > 0
      ? round2(semesterPoints / semesterCreditHours)
      : null);

  const cumulativeCreditHours =
    footerInfo.cumulativeCreditHours ?? semesterCreditHours;
  const cumulativePoints = footerInfo.cumulativePoints ?? semesterPoints;
  const cumulativeCgpa =
    footerInfo.cumulativeCgpa ??
    (cumulativeCreditHours > 0
      ? round2(cumulativePoints / cumulativeCreditHours)
      : null);

  return {
    academic_year: headingParts.academicYear,
    semester: headingParts.semester,
    year_level: headingParts.yearLevel,
    courses,
    semester_summary: {
      credit_hours: round2(semesterCreditHours),
      points: round2(semesterPoints),
      sgpa: semesterSgpa,
      academic_status: footerInfo.academicStatus || null,
    },
    cumulative_summary: {
      credit_hours: round2(cumulativeCreditHours),
      points: round2(cumulativePoints),
      cgpa: cumulativeCgpa,
    },
  };
}

function parseSemesterHeading(heading) {
  if (!heading) return null;

  const match = heading.match(/^(\d{4}\/\d{4})\s+(.+?)(?:\s+\[(.+)\])?$/);
  if (!match) return null;

  return {
    academicYear: cleanText(match[1]),
    semester: cleanText(match[2]),
    yearLevel: cleanText(match[3] || "") || null,
  };
}

function parseCourseRow(row) {
  const cells = Array.from(row.querySelectorAll("td"));
  if (cells.length < 5) {
    return null;
  }

  const code = cleanText(cells[0].textContent);
  const title = cleanText(cells[1].textContent);
  const creditHours = parseNumeric(cells[2].textContent);
  const grade = cleanText(cells[3].textContent);
  const points = parseNumeric(cells[4].textContent);

  if (!code || !title) {
    return null;
  }

  if (creditHours === null) {
    return null;
  }

  if (creditHours <= 0) {
    return null;
  }

  return {
    code,
    title,
    credit_hours: creditHours,
    grade: grade || "-",
    points,
  };
}

function parseFooter(tfoot) {
  if (!tfoot) {
    return {
      semesterCreditHours: null,
      semesterPoints: null,
      semesterSgpa: null,
      cumulativeCreditHours: null,
      cumulativePoints: null,
      cumulativeCgpa: null,
      academicStatus: null,
    };
  }

  const rows = Array.from(tfoot.querySelectorAll("tr"));
  const semesterRowText = cleanText(rows[0]?.innerText || "");
  const cumulativeRowText = cleanText(rows[1]?.innerText || "");

  const semesterNumbers = extractNumbers(semesterRowText);
  const cumulativeNumbers = extractNumbers(cumulativeRowText);

  const academicStatusMatch = cumulativeRowText.match(
    /Academic\s+Status\s*:\s*([^\n]+)/i,
  );

  return {
    semesterCreditHours: semesterNumbers[0] ?? null,
    semesterPoints: semesterNumbers[1] ?? null,
    semesterSgpa: semesterNumbers[2] ?? null,
    cumulativeCreditHours: cumulativeNumbers[0] ?? null,
    cumulativePoints: cumulativeNumbers[1] ?? null,
    cumulativeCgpa: cumulativeNumbers[2] ?? null,
    academicStatus: academicStatusMatch
      ? cleanText(academicStatusMatch[1])
      : null,
  };
}

function extractGpaSummary() {
  const tab = document.querySelector("#gpa_summary");
  const text = cleanText(tab?.innerText || "");

  return {
    academicStatus:
      extractByPattern(text, /Academic\s+status\s*:\s*([^\n]+)/i) || null,
    semesterGpa: parseNumeric(
      extractByPattern(text, /Semester\s+GPA\s*:\s*([\d.\-]+)/i),
    ),
    cumulativeGpa: parseNumeric(
      extractByPattern(text, /Cumulative\s+GPA\s*:\s*([\d.\-]+)/i),
    ),
  };
}

function scrapePageData() {
  const text = document.body.innerText;

  return {
    studentId:
      extractByPattern(
        text,
        /(?:Student\s*ID|ID\s*No)\s*[:\-]\s*([A-Za-z0-9\/-]+)/i,
      ) || "STU-UNKNOWN",
    name:
      extractByPattern(text, /Name\s*[:\-]\s*([^\n]+)/i) || "Unknown Student",
    department:
      extractByPattern(text, /Department\s*[:\-]\s*([^\n]+)/i) ||
      "Unknown Department",
    year:
      extractByPattern(
        text,
        /(First|Second|Third|Fourth|Fifth|Sixth)\s+Year/i,
      ) || "Unknown Year",
    status: "Unknown",
    courses: [],
    transcriptData: {
      student_id: null,
      semesters: [],
    },
    extractedFrom: window.location.hostname,
    extractedAt: new Date().toISOString(),
  };
}

function extractByPattern(text, pattern) {
  const match = text.match(pattern);
  return match ? cleanText(match[1]) : null;
}

function extractNumbers(text) {
  return (text.match(/-?\d+(?:\.\d+)?/g) || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function parseNumeric(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/,/g, "").trim();
  if (!cleaned || cleaned === "-") return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function round2(value) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

function detectPortal() {
  const isAStu = window.location.hostname.includes("estudent.astu.edu.et");

  if (isAStu) {
    console.log("[VentureScope] ASTU eStudent Portal detected");
    extensionApi?.runtime
      .sendMessage({ action: "portalDetected", portal: "ASTU" })
      .catch(() => {});
  }
}

detectPortal();
