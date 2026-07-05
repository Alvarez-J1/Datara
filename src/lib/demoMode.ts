"use client";

import { useEffect, useState } from "react";

export const DEMO_MODE_COOKIE = "datara-demo-mode";
const DEMO_MODE_EVENT = "datara-demo-mode-change";

export const enableDemoMode = () => {
  document.cookie = `${DEMO_MODE_COOKIE}=true; path=/; max-age=86400; SameSite=Lax`;
  window.localStorage.setItem(DEMO_MODE_COOKIE, "true");
  emitDemoModeChange();
};

export const clearDemoMode = () => {
  document.cookie = `${DEMO_MODE_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
  window.localStorage.removeItem(DEMO_MODE_COOKIE);
  emitDemoModeChange();
};

export const isDemoModeEnabled = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(DEMO_MODE_COOKIE) === "true" ||
    document.cookie
      .split(";")
      .some((cookie) => cookie.trim() === `${DEMO_MODE_COOKIE}=true`)
  );
};

export const useDemoMode = (): boolean => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const syncDemoMode = () => setIsDemoMode(isDemoModeEnabled());
    const timeoutId = window.setTimeout(syncDemoMode, 0);
    const unsubscribe = subscribeToDemoMode(syncDemoMode);

    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  return isDemoMode;
};

const subscribeToDemoMode = (onStoreChange: () => void): (() => void) => {
  window.addEventListener(DEMO_MODE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(DEMO_MODE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
};

const emitDemoModeChange = () => {
  window.dispatchEvent(new Event(DEMO_MODE_EVENT));
};
