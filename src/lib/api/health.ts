import { apiRequest } from "@/lib/api/client";

type HealthResponse = {
  status: string;
};

const HEALTH_REQUEST_TIMEOUT_MS = 8000;
const BACKEND_WAIT_TIMEOUT_MS = 150000;
const BACKEND_RETRY_DELAY_MS = 1500;
const RECENT_HEALTH_TTL_MS = 30000;

let backendWarmupRequest: Promise<boolean> | null = null;
let lastHealthyAt = 0;

export const warmBackend = (): Promise<boolean> => {
  if (wasRecentlyHealthy()) {
    return Promise.resolve(true);
  }

  if (!backendWarmupRequest) {
    backendWarmupRequest = checkBackendHealth().finally(() => {
      backendWarmupRequest = null;
    });
  }

  return backendWarmupRequest;
};

export const waitForBackend = async (
  timeoutMs = BACKEND_WAIT_TIMEOUT_MS
): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  if (await warmBackend()) {
    return;
  }

  while (Date.now() < deadline) {
    await delay(Math.min(BACKEND_RETRY_DELAY_MS, deadline - Date.now()));

    if (await warmBackend()) {
      return;
    }
  }

  throw new Error("The backend is still waking up. Please try again in a moment.");
};

const checkBackendHealth = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, HEALTH_REQUEST_TIMEOUT_MS);

  try {
    const response = await apiRequest<HealthResponse>("/api/health", {
      auth: false,
      cache: "no-store",
      signal: controller.signal,
    });
    const isHealthy = response.status === "ok";

    if (isHealthy) {
      lastHealthyAt = Date.now();
    }

    return isHealthy;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

const wasRecentlyHealthy = (): boolean => {
  return lastHealthyAt > 0 && Date.now() - lastHealthyAt < RECENT_HEALTH_TTL_MS;
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
