import { api, getApiErrorMessage } from "./client";
import type { UserSession } from "../lib/types";
import { normalizeUserSession } from "../lib/normalize";

export async function login(email: string, password: string): Promise<UserSession> {
  try {
    const res = await api.post("/api/auth/login", { email, password }, { headers: { "Content-Type": "application/json" } });
    const payload = res.data ?? {};
    const apiUser = payload?.user || payload?.data?.user || payload?.data || {};
    const accessToken =
      payload?.access_token ||
      payload?.data?.access_token ||
      payload?.token ||
      payload?.data?.token ||
      null;
    const tokenType = payload?.token_type || payload?.data?.token_type || "bearer";

    if (!accessToken) throw new Error("Login succeeded but no access token was returned.");

    const displayName =
      apiUser.name ||
      [apiUser.first_name, apiUser.last_name].filter(Boolean).join(" ") ||
      email.split("@")[0];

    const session = normalizeUserSession({
      id: String(apiUser.id || apiUser.user_id || email),
      email: apiUser.email || email,
      name: displayName,
      accessToken,
      tokenType,
      token: accessToken,
      loginTime: new Date().toISOString(),
    });
    if (!session) throw new Error("Login failed to create session.");
    return session;
  } catch (e) {
    throw new Error(getApiErrorMessage(e));
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout", null);
  } catch (e) {
    // Local logout should still work; keep the error non-fatal.
    console.warn("[logout] backend call failed:", getApiErrorMessage(e));
  }
}

