"use client";

import { useEffect, useState } from "react";
import { isDemoModeEnabled } from "@/lib/demoMode";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const AUTH_TOKEN_STORAGE_KEY = "datara.authToken";
const AUTH_USER_STORAGE_KEY = "datara.authUser";
const AUTH_SESSION_COOKIE = "datara-authenticated";
const AUTH_TOKEN_EVENT = "datara-auth-token-change";

export type StoredAuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};
const DEMO_EMAIL = "admin@datara.local";
const DEMO_PASSWORD = "DataraDemo123!";
const MISSING_AUTH_TOKEN_MESSAGE = "Authentication token is missing.";
const NETWORK_ERROR_STATUS = 0;

let demoAuthTokenRequest: Promise<string> | null = null;

type JsonBody = Record<string, unknown> | unknown[];
type RequestBody = BodyInit | JsonBody | null;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  body?: RequestBody;
  auth?: boolean;
};

export type ChartDataset<T extends number = number> = {
  label: string;
  data: T[];
};

export type ChartData<T extends number = number> = {
  labels: string[];
  datasets: ChartDataset<T>[];
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  document.cookie = `${AUTH_SESSION_COOKIE}=true; path=/; max-age=86400; SameSite=Lax`;
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};

export const removeAuthToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  document.cookie = `${AUTH_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};

/**
 * Persists the user object returned alongside a login/register/me response,
 * so components know who is actually signed in.
 */
export const setAuthUser = (user: StoredAuthUser): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
};

export const getAuthUser = (): StoredAuthUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
};

/**
 * Tracks whether a Datara-issued auth token (email/password sign in or sign
 * up) is present. The token lives in localStorage, so components that gate
 * UI on "is the user logged in" use this hook.
 */
export const useHasAuthToken = (): boolean => {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const syncToken = () => setHasToken(Boolean(getAuthToken()));
    syncToken();

    window.addEventListener(AUTH_TOKEN_EVENT, syncToken);
    window.addEventListener("storage", syncToken);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncToken);
      window.removeEventListener("storage", syncToken);
    };
  }, []);

  return hasToken;
};

/**
 * Returns the signed-in user's name/email for credential-based auth, so
 * screens can show who is actually logged in instead of falling back to
 * demo/placeholder copy.
 */
export const useAuthUser = (): StoredAuthUser | null => {
  const [user, setUser] = useState<StoredAuthUser | null>(null);

  useEffect(() => {
    const syncUser = () => setUser(getAuthUser());
    syncUser();

    window.addEventListener(AUTH_TOKEN_EVENT, syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  return user;
};

export const apiRequest = async <T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const { auth = true, body, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const serializedBody = serializeBody(body);

  if (!requestHeaders.has("Accept")) {
    requestHeaders.set("Accept", "application/json");
  }

  if (body !== undefined && !requestHeaders.has("Content-Type") && isJsonBody(body)) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAuthToken() ?? (await getDemoAuthToken());

    if (!token) {
      throw new ApiError(MISSING_AUTH_TOKEN_MESSAGE, 401, null);
    }

    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(buildApiUrl(path), {
      ...requestOptions,
      body: serializedBody,
      headers: requestHeaders,
    });
  } catch (error) {
    throw new ApiError(getNetworkErrorMessage(error), NETWORK_ERROR_STATUS, null);
  }

  let data = await parseResponse(response);

  if (auth && response.status === 401 && isDemoModeEnabled()) {
    removeAuthToken();
    const refreshedToken = await getDemoAuthToken();

    if (refreshedToken) {
      requestHeaders.set("Authorization", `Bearer ${refreshedToken}`);

      try {
        response = await fetch(buildApiUrl(path), {
          ...requestOptions,
          body: serializedBody,
          headers: requestHeaders,
        });
      } catch (error) {
        throw new ApiError(getNetworkErrorMessage(error), NETWORK_ERROR_STATUS, null);
      }

      data = await parseResponse(response);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
    }

    throw new ApiError(getErrorMessage(data, response.statusText), response.status, data);
  }

  return data as T;
};

export const normalizeChartData = (
  data: ChartData | undefined
): ChartData => {
  return {
    labels: Array.isArray(data?.labels) ? data.labels.map(String) : [],
    datasets: Array.isArray(data?.datasets)
      ? data.datasets.map((dataset) => ({
          label: typeof dataset?.label === "string" ? dataset.label : "",
          data: Array.isArray(dataset?.data)
            ? dataset.data.map(toFiniteNumber)
            : [],
        }))
      : [],
  };
};

export const reportApiError = (error: unknown, context: string): void => {
  if (typeof console === "undefined") {
    return;
  }

  if (error instanceof ApiError) {
    if (isMissingAuthTokenError(error)) {
      return;
    }

    console.error(`${context}: ${error.message}`, {
      data: error.data,
      status: error.status,
    });
    return;
  }

  if (error instanceof Error) {
    console.error(`${context}: ${error.message}`);
    return;
  }

  console.error(`${context}: Request failed`);
};

export const reportSettledApiError = <T>(
  result: PromiseSettledResult<T>,
  context: string
): void => {
  if (result.status === "rejected") {
    reportApiError(result.reason, context);
  }
};

const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL.replace(/\/$/, "")}${normalizedPath}`;
};

const isJsonBody = (body: RequestBody): body is JsonBody => {
  return (
    body !== null &&
    typeof body === "object" &&
    !(body instanceof Blob) &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams)
  );
};

const serializeBody = (body: RequestBody | undefined): BodyInit | null | undefined => {
  if (body === undefined || body === null) {
    return body;
  }

  return isJsonBody(body) ? JSON.stringify(body) : (body as BodyInit);
};

const parseResponse = async (response: Response): Promise<unknown> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const text = await response.text();

  if (!text) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError("Invalid JSON response", response.status, text);
    }
  }

  return text || null;
};

const getDemoAuthToken = async (): Promise<string | null> => {
  if (!isDemoModeEnabled()) {
    return null;
  }

  if (!demoAuthTokenRequest) {
    demoAuthTokenRequest = requestDemoAuthToken().finally(() => {
      demoAuthTokenRequest = null;
    });
  }

  return demoAuthTokenRequest;
};

const requestDemoAuthToken = async (): Promise<string> => {
  let response: Response;

  try {
    response = await fetch(buildApiUrl("/api/auth/login"), {
      body: JSON.stringify({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      }),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  } catch (error) {
    throw new ApiError(getNetworkErrorMessage(error), NETWORK_ERROR_STATUS, null);
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, response.statusText), response.status, data);
  }

  if (!isAuthResponse(data)) {
    throw new ApiError("Demo authentication response did not include a token.", 401, data);
  }

  setAuthToken(data.token);
  return data.token;
};

const isAuthResponse = (data: unknown): data is { token: string } => {
  return (
    data !== null &&
    typeof data === "object" &&
    "token" in data &&
    typeof (data as { token?: unknown }).token === "string" &&
    Boolean((data as { token: string }).token.trim())
  );
};

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  return fallback || "Request failed";
};

const getNetworkErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Network request failed";
};

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const isMissingAuthTokenError = (error: ApiError): boolean => {
  return error.status === 401 && error.message === MISSING_AUTH_TOKEN_MESSAGE;
};
