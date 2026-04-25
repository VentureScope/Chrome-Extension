import type { UserSession } from "./types";

export function normalizeTokenType(tokenType: unknown): string {
  const value = String(tokenType || "bearer").trim();
  if (!value) return "Bearer";
  return value.toLowerCase() === "bearer" ? "Bearer" : value;
}

export function normalizeUserSession(user: any): UserSession | null {
  if (!user) return null;
  const accessToken = String(user.accessToken || user.access_token || user.token || "").trim();
  return {
    id: String(user.id || user.user_id || user.email || "session-user"),
    email: String(user.email || "").trim(),
    name: String(user.name || "User").trim() || "User",
    accessToken,
    tokenType: normalizeTokenType(user.tokenType || user.token_type),
    loginTime: String(user.loginTime || new Date().toISOString()),
  };
}

export function normalizeStudentId(value: unknown): string {
  return String(value ?? "");
}

