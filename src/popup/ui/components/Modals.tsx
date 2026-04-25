import React from "react";
import type { AcademicData } from "../../lib/types";

export function ReviewModal({
  open,
  data,
  payload,
  onCancel,
  onContinue,
}: {
  open: boolean;
  data: AcademicData | null;
  payload: any;
  onCancel: () => void;
  onContinue: () => void;
}) {
  if (!open || !data) return null;
  const semesters = payload?.transcript_data?.semesters || [];
  const courseCount = semesters.reduce(
    (sum: number, s: any) => sum + (s.courses?.length || 0),
    0,
  );
  const payloadText = JSON.stringify(payload, null, 2);

  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-header">
          <h2>Review Scraped Data</h2>
          <button className="btn-close" onClick={onCancel}>
            ×
          </button>
        </div>
        <div className="consent-body">
          <p className="consent-intro">
            Review the extracted data before it is sent to the backend.
          </p>
          <div className="consent-items">
            <div className="consent-item">
              <span>
                <strong>Student ID:</strong>{" "}
                {payload?.transcript_data?.student_id ||
                  data?.studentId ||
                  "Not Provided"}
              </span>
            </div>
            <div className="consent-item">
              <span>
                <strong>Student Name:</strong> {data?.name || "Unknown"}
              </span>
            </div>
            <div className="consent-item">
              <span>
                <strong>Semesters:</strong> {semesters.length}
              </span>
            </div>
            <div className="consent-item">
              <span>
                <strong>Courses:</strong> {courseCount}
              </span>
            </div>
          </div>

          <div className="review-payload-wrap">
            <div className="review-payload-title">Upload Payload Preview</div>
            <pre className="review-payload">
              {payloadText.length > 18000
                ? `${payloadText.slice(0, 18000)}\n... (truncated for preview)`
                : payloadText}
            </pre>
          </div>
        </div>
        <div className="consent-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onContinue}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConsentModal({
  open,
  onDecline,
  onAccept,
}: {
  open: boolean;
  onDecline: () => void;
  onAccept: () => void;
}) {
  if (!open) return null;
  return (
    <div className="consent-overlay">
      <div className="consent-modal">
        <div className="consent-header">
          <h2>Data Extraction Consent</h2>
          <button className="btn-close" onClick={onDecline}>
            ×
          </button>
        </div>
        <div className="consent-body">
          <p className="consent-intro">
            VentureScope will extract the following data from your ASTU e-Student
            account:
          </p>

          <div className="consent-items">
            {[
              "Student ID & Name",
              "Courses & Grades",
              "GPA & Academic Standing",
              "Degree Progress & Transcript",
            ].map((label) => (
              <div className="consent-item" key={label}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="#0066ff">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  />
                </svg>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="consent-warning">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="#f59e0b">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              />
            </svg>
            <span>This data will be securely stored locally on your device.</span>
          </div>

          <p className="consent-terms">
            By clicking "Accept," you agree to allow VentureScope to extract your
            academic data from ASTU e-Student portal.
          </p>
        </div>
        <div className="consent-actions">
          <button className="btn btn-secondary" onClick={onDecline}>
            Decline
          </button>
          <button className="btn btn-primary" onClick={onAccept}>
            Accept & Extract
          </button>
        </div>
      </div>
    </div>
  );
}

