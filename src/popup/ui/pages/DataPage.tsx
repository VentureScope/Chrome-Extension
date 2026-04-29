import React from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { useAppStore } from "../../state/store";

export function DataPage() {
  const navigate = useNavigate();
  const syncedData = useAppStore((s) => s.syncedData);

  return (
    <div className="screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button className="btn-back" onClick={() => navigate("/dashboard")}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            />
          </svg>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0f172a", margin: 0 }}>
          Synced Academic Data
        </h2>
      </div>

      {!syncedData ? (
        <p className="empty-state">No synced data yet.</p>
      ) : (
        <div className="data-container">
          <div className="data-section">
            <h3>Personal Information</h3>
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">Student ID</span>
                <span className="data-value">{syncedData.studentId || "N/A"}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Department</span>
                <span className="data-value">{syncedData.department || "N/A"}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Year</span>
                <span className="data-value">{syncedData.year || "N/A"}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Status</span>
                <span className="data-value">{syncedData.status || "N/A"}</span>
              </div>
            </div>
          </div>

          <div className="data-section">
            <h3>Courses & Grades</h3>
            {syncedData.courses?.length ? (
              <div>
                {syncedData.courses.map((course, idx) => (
                  <div className="course-item" key={`${course.code}-${idx}`}>
                    <div className="course-header">
                      <span className="course-name">{course.name || course.title}</span>
                      <span className="course-grade">{course.grade}</span>
                    </div>
                    <div className="course-code">
                      {course.code} • {course.credits} Credits
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No course data available.</p>
            )}
          </div>

          <div className="data-section">
            <h3>Academic Progress</h3>
            <div className="data-grid">
              <div className="data-item">
                <span className="data-label">GPA</span>
                <span className="data-value">{syncedData.gpa || "N/A"}</span>
              </div>
              <div className="data-item">
                <span className="data-label">Completion</span>
                <span className="data-value">
                  {(syncedData as any).degreeProgress?.completionPercentage ?? "N/A"}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

