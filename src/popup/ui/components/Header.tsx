import React from "react";

export function Header({
  subtitle,
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <div className="header">
      <div className="logo">
        <svg width={compact ? 28 : 32} height={compact ? 28 : 32} viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="#0066ff" />
          <path d="M16 8L22 16L16 24L10 16L16 8Z" fill="white" />
        </svg>
        <h1>VentureScope</h1>
      </div>
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
    </div>
  );
}

