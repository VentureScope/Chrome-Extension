import axios, { AxiosError } from "axios";
import { normalizeTokenType } from "../lib/normalize";
import { useAppStore } from "../state/store";

export const API_BASE_URL = "https://backend-1-tcmy.onrender.com";
const API_LOG_PREFIX = "[VS API]";

function buildRequestId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeHeaders(headers: any) {
  if (!headers) return {};
  const normalized =
    typeof headers?.toJSON === "function" ? headers.toJSON() : { ...headers };
  const auth = normalized.Authorization || normalized.authorization;
  if (auth) {
    const authText = String(auth);
    const tokenPart = authText.split(" ")[1] || "";
    const redacted = `${authText.split(" ")[0] || "Bearer"} ***${tokenPart.slice(-6)}`;
    if (normalized.Authorization) normalized.Authorization = redacted;
    if (normalized.authorization) normalized.authorization = redacted;
  }
  return normalized;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const requestId = buildRequestId();
  (config as any).__requestId = requestId;
  (config as any).__startedAt = Date.now();

  const token = useAppStore.getState().user?.accessToken;
  const tokenType = useAppStore.getState().user?.tokenType;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `${normalizeTokenType(tokenType)} ${token}`;
  }

  console.log(`${API_LOG_PREFIX} [${requestId}] request:start`, {
    method: String(config.method || "get").toUpperCase(),
    baseURL: config.baseURL,
    url: config.url,
    timeout: config.timeout,
    headers: sanitizeHeaders(config.headers),
    data: config.data,
    params: config.params,
  });

  return config;
});

api.interceptors.response.use(
  (response) => {
    const requestId = (response.config as any).__requestId || "unknown";
    const startedAt = (response.config as any).__startedAt || Date.now();
    console.log(`${API_LOG_PREFIX} [${requestId}] request:success`, {
      method: String(response.config.method || "get").toUpperCase(),
      url: response.config.url,
      status: response.status,
      statusText: response.statusText,
      elapsedMs: Date.now() - startedAt,
      headers: response.headers,
      data: response.data,
    });
    return response;
  },
  (error) => {
    const axiosError = error as AxiosError<any>;
    const config: any = axiosError?.config || {};
    const requestId = config.__requestId || "unknown";
    const startedAt = config.__startedAt || Date.now();

    console.error(`${API_LOG_PREFIX} [${requestId}] request:error`, {
      method: String(config.method || "get").toUpperCase(),
      url: config.url,
      elapsedMs: Date.now() - startedAt,
      code: axiosError?.code,
      message: axiosError?.message,
      requestData: config.data,
      responseStatus: axiosError?.response?.status,
      responseStatusText: axiosError?.response?.statusText,
      responseHeaders: axiosError?.response?.headers,
      responseData: axiosError?.response?.data,
      stack: axiosError?.stack,
    });

    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (!error) return "Request failed.";
  if (typeof error === "string") return error;

  const axiosError = error as AxiosError<any>;
  if (axiosError?.code === "ECONNABORTED") return "Request timed out.";
  const status = axiosError?.response?.status;
  const data = axiosError?.response?.data;

  const message =
    data?.message ||
    data?.detail ||
    (typeof data === "string" ? data : null) ||
    axiosError?.message ||
    "Request failed.";

  return status ? `${message}` : message;
}
