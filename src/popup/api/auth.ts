import { api, getApiErrorMessage } from "./client";
import type { UserSession } from "../lib/types";
import { normalizeUserSession } from "../lib/normalize";
import { API_BASE_URL } from "./client";

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

export async function oauthLogin(provider: "google" | "github"): Promise<UserSession> {
  const redirectUrl = chrome.identity.getRedirectURL();
  const authUrl = `${API_BASE_URL}/api/auth/${provider}?redirect_uri=${encodeURIComponent(redirectUrl)}`;

  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          return reject(new Error(chrome.runtime.lastError?.message || "OAuth flow failed"));
        }

        try {
          const url = new URL(responseUrl);
          const accessToken = url.searchParams.get("access_token") || url.searchParams.get("token");
          const tokenType = url.searchParams.get("token_type") || "bearer";
          const error = url.searchParams.get("error");

          if (error) {
            return reject(new Error(url.searchParams.get("error_description") || error));
          }

          if (!accessToken) {
            return reject(new Error("Login succeeded but no access token was returned."));
          }

          const email = url.searchParams.get("email") || "";
          const name = url.searchParams.get("name") || email.split("@")[0] || "User";
          const id = url.searchParams.get("id") || email || "oauth-user";

          const session = normalizeUserSession({
            id: String(id),
            email: email,
            name: name,
            accessToken,
            tokenType,
            token: accessToken,
            loginTime: new Date().toISOString(),
          });

          if (!session) return reject(new Error("Login failed to create session."));
          resolve(session);
        } catch (err: any) {
          reject(new Error(err.message || "Failed to parse OAuth response"));
        }
      }
    );
  });
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/auth/logout", null);
  } catch (e) {
    // Local logout should still work; keep the error non-fatal.
    console.warn("[logout] backend call failed:", getApiErrorMessage(e));
  }
}

