"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest, useHasAuthToken } from "@/lib/api/client";
import { useDemoMode } from "@/lib/demoMode";

export type DefaultTimeRange = "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_12_MONTHS";
export type TablePageSize = 25 | 50 | 100;
export type Theme = "LIGHT" | "DARK" | "SYSTEM";

/**
 * Which of these fields actually change app behavior today, versus which
 * are persisted-only (saved/loaded correctly, but with no visible effect
 * yet), so it's clear at a glance what to expect:
 *
 * - tablePageSize: applied - initializes the Revenue Data table's page size.
 * - compactMode: applied - reduces dashboard card padding/spacing and the
 *   Revenue Data table's row height.
 * - theme: applied - initializes light/dark/system on app load.
 * - defaultTimeRange: applied - dashboard summary, revenue trend, retention,
 *   customer segment, region mix, and Revenue Data requests pass it through to
 *   the backend where supported.
 * - weeklyReport / emailDigest / anomalyAlerts: persisted-only by design.
 *   There is no email/notification delivery system in this app, so these
 *   toggles intentionally do not simulate sending anything.
 */
export type UserSettings = {
  defaultTimeRange: DefaultTimeRange;
  tablePageSize: TablePageSize;
  compactMode: boolean;
  weeklyReport: boolean;
  emailDigest: boolean;
  anomalyAlerts: boolean;
  theme: Theme;
};

const DEFAULT_USER_SETTINGS: UserSettings = {
  anomalyAlerts: true,
  compactMode: false,
  defaultTimeRange: "LAST_12_MONTHS",
  emailDigest: false,
  tablePageSize: 25,
  theme: "SYSTEM",
  weeklyReport: true,
};
const THEME_PREFERENCE_STORAGE_KEY = "datara.themePreference";

export const getUserSettings = (): Promise<UserSettings> => {
  return apiRequest<UserSettings>("/api/users/me/settings");
};

export const updateUserSettings = (
  settings: UserSettings
): Promise<UserSettings> => {
  return apiRequest<UserSettings>("/api/users/me/settings", {
    body: settings,
    method: "PUT",
  });
};

type SettingsContextValue = {
  error: string;
  isLoading: boolean;
  isSavingTheme: boolean;
  settings: UserSettings | null;
  setThemePreference: (theme: Theme) => Promise<UserSettings>;
  themePreference: Theme;
  updateSettings: (settings: UserSettings) => Promise<UserSettings>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const hasAuthToken = useHasAuthToken();
  const isDemoMode = useDemoMode();
  const canUseBackendSettings = hasAuthToken || isDemoMode;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(canUseBackendSettings);
  const [isSavingTheme, setIsSavingTheme] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  // Start at the server-safe default ("SYSTEM") on every render, then read
  // the cached preference in an effect below. Reading localStorage directly
  // in the initializer would make the client's first render diverge from
  // the server-rendered HTML (server has no `window`/localStorage), which
  // caused a hydration mismatch cascading through every themed component.
  const [themePreference, setThemePreferenceState] = useState<Theme>("SYSTEM");

  useEffect(() => {
    const cachedThemePreference = readCachedThemePreference();

    if (cachedThemePreference !== "SYSTEM") {
      setThemePreferenceState(cachedThemePreference);
    }
  }, []);

  const applySettings = useCallback((nextSettings: UserSettings) => {
    setSettings(nextSettings);
    setThemePreferenceState(nextSettings.theme);
    cacheThemePreference(nextSettings.theme);
  }, []);

  useEffect(() => {
    if (!canUseBackendSettings) {
      setError("");
      setIsLoading(false);
      setSettings(null);
      return;
    }

    let isMounted = true;
    setError("");
    setIsLoading(true);

    getUserSettings()
      .then((loadedSettings) => {
        if (isMounted) {
          applySettings(loadedSettings);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getSettingsErrorMessage(requestError));
          setSettings(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applySettings, canUseBackendSettings]);

  const persistSettings = useCallback(
    async (nextSettings: UserSettings) => {
      const previousSettings = settings;
      const previousThemePreference = themePreference;

      applySettings(nextSettings);
      setError("");

      try {
        const savedSettings = await updateUserSettings(nextSettings);
        applySettings(savedSettings);
        return savedSettings;
      } catch (requestError) {
        if (previousSettings) {
          applySettings(previousSettings);
        } else {
          setSettings(null);
          setThemePreferenceState(previousThemePreference);
          cacheThemePreference(previousThemePreference);
        }

        setError(getSettingsErrorMessage(requestError));
        throw requestError;
      }
    },
    [applySettings, settings, themePreference]
  );

  const setThemePreference = useCallback(
    async (nextTheme: Theme) => {
      const previousThemePreference = themePreference;

      setThemePreferenceState(nextTheme);
      cacheThemePreference(nextTheme);

      if (!canUseBackendSettings) {
        return { ...(settings ?? DEFAULT_USER_SETTINGS), theme: nextTheme };
      }

      setIsSavingTheme(true);

      try {
        const currentSettings = settings ?? (await getUserSettings());
        const savedSettings = await persistSettings({
          ...currentSettings,
          theme: nextTheme,
        });

        return savedSettings;
      } catch (requestError) {
        setThemePreferenceState(previousThemePreference);
        cacheThemePreference(previousThemePreference);
        throw requestError;
      } finally {
        setIsSavingTheme(false);
      }
    },
    [canUseBackendSettings, persistSettings, settings, themePreference]
  );

  const value = useMemo(
    () => ({
      error,
      isLoading,
      isSavingTheme,
      settings,
      setThemePreference,
      themePreference,
      updateSettings: persistSettings,
    }),
    [
      error,
      isLoading,
      isSavingTheme,
      persistSettings,
      settings,
      setThemePreference,
      themePreference,
    ]
  );

  return createElement(
    SettingsContext.Provider,
    { value },
    children
  );
};

/**
 * Loads the signed-in user's saved settings so pages/providers can apply
 * them (theme, compact mode, table page size, etc.) without each having to
 * re-implement the same auth gating.
 *
 * Google-session users have no Datara JWT yet (a pre-existing gap - see
 * Profile/Settings pages), so the request is skipped entirely for them and
 * `settings` simply stays `null`, leaving callers to fall back to defaults.
 * This intentionally never throws to the caller; a failed/skipped load just
 * means "use the default appearance," matching how the rest of the app
 * degrades gracefully when a fetch is unavailable.
 */
export const useUserSettings = (): {
  error: string;
  settings: UserSettings | null;
  isLoading: boolean;
} => {
  const context = useSettingsContext();

  return {
    error: context.error,
    isLoading: context.isLoading,
    settings: context.settings,
  };
};

export const useSettingsActions = (): Pick<
  SettingsContextValue,
  "isSavingTheme" | "setThemePreference" | "themePreference" | "updateSettings"
> => {
  const context = useSettingsContext();

  return {
    isSavingTheme: context.isSavingTheme,
    setThemePreference: context.setThemePreference,
    themePreference: context.themePreference,
    updateSettings: context.updateSettings,
  };
};

const useSettingsContext = (): SettingsContextValue => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error("useUserSettings must be used inside SettingsProvider");
  }

  return context;
};

const readCachedThemePreference = (): Theme => {
  if (typeof window === "undefined") {
    return "SYSTEM";
  }

  return parseTheme(window.localStorage.getItem(THEME_PREFERENCE_STORAGE_KEY));
};

const cacheThemePreference = (theme: Theme): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, theme);
};

const parseTheme = (value: unknown): Theme => {
  if (value === "LIGHT" || value === "DARK" || value === "SYSTEM") {
    return value;
  }

  return "SYSTEM";
};

const getSettingsErrorMessage = (error: unknown): string => {
  return error instanceof Error && error.message.trim()
    ? error.message
    : "Unable to load workspace settings.";
};
