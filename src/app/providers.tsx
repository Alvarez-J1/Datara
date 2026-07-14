"use client";

import { createContext, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import useMediaQuery from "@mui/material/useMediaQuery";

import darkTheme from "@/theme/darkTheme";
import lightTheme from "@/theme/lightTheme";
import {
  SettingsProvider,
  useSettingsActions,
  type Theme,
  type UserSettings,
} from "@/lib/api/settings";

type ColorModeContextValue = {
  isSavingTheme: boolean;
  resolvedMode: "dark" | "light";
  setThemePreference: (theme: Theme) => Promise<UserSettings>;
  themePreference: Theme;
  toggleColorMode: () => void;
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

const BRAND_ASSETS = {
  dark: {
    favicon: "/datara-favicon-light.svg",
    manifest: "/manifest-dark.webmanifest",
    themeColor: "#050b12",
  },
  light: {
    favicon: "/datara-favicon-light.svg",
    manifest: "/manifest-light.webmanifest",
    themeColor: "#ffffff",
  },
} as const;

export const ColorModeContext = createContext<ColorModeContextValue>({
  isSavingTheme: false,
  resolvedMode: "light" as "dark" | "light",
  setThemePreference: async (theme: Theme) => ({
    ...DEFAULT_USER_SETTINGS,
    theme,
  }),
  themePreference: "SYSTEM" as Theme,
  toggleColorMode: () => {},
});

/**
 * Resolves the persisted `theme` setting (LIGHT/DARK/SYSTEM) into the actual
 * MUI palette mode. SYSTEM deliberately stays tied to prefers-color-scheme, so
 * OS theme changes update the app without creating a local override.
 */
function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const {
    isSavingTheme,
    setThemePreference,
    themePreference,
  } = useSettingsActions();
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)", {
    noSsr: true,
  });
  const mode = resolveThemeMode(themePreference, prefersDarkMode);

  useEffect(() => {
    document.documentElement.dataset.dataraTheme = mode;
    document.documentElement.dataset.dataraThemePreference = themePreference;
    document.documentElement.style.colorScheme = mode;
  }, [mode, themePreference]);

  const colorMode = useMemo(
    () => ({
      isSavingTheme,
      resolvedMode: mode,
      setThemePreference,
      themePreference,
      toggleColorMode: () => {
        void setThemePreference(mode === "dark" ? "LIGHT" : "DARK");
      },
    }),
    [isSavingTheme, mode, setThemePreference, themePreference]
  );

  const theme = useMemo(
    () => createTheme(mode === "light" ? lightTheme : darkTheme),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <DataraBrandMetadata mode={mode} />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

function DataraBrandMetadata({ mode }: { mode: "dark" | "light" }) {
  useEffect(() => {
    const assets = BRAND_ASSETS[mode];

    document
      .querySelectorAll(
        [
          "link[data-datara-static-icon]",
          'link[rel="manifest"]:not([data-datara-managed])',
          "meta[data-datara-static-theme-color]",
        ].join(", ")
      )
      .forEach((element) => element.remove());

    const iconLink = ensureLinkElement("icon", "icon");
    iconLink.href = assets.favicon;
    iconLink.type = "image/svg+xml";

    const shortcutIconLink = ensureLinkElement(
      "shortcut-icon",
      "shortcut icon"
    );
    shortcutIconLink.href = assets.favicon;
    shortcutIconLink.type = "image/svg+xml";

    const manifestLink = ensureLinkElement("manifest", "manifest");
    manifestLink.href = assets.manifest;

    const themeColorMeta = ensureMetaElement("theme-color", "theme-color");
    themeColorMeta.content = assets.themeColor;
  }, [mode]);

  return null;
}

const ensureLinkElement = (key: string, rel: string): HTMLLinkElement => {
  const selector = `link[data-datara-managed="${key}"]`;
  const existing = document.head.querySelector<HTMLLinkElement>(selector);

  if (existing) {
    existing.rel = rel;
    return existing;
  }

  const matchingRel = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]`
  );

  if (matchingRel) {
    matchingRel.dataset.dataraManaged = key;
    matchingRel.rel = rel;
    return matchingRel;
  }

  const link = document.createElement("link");
  link.dataset.dataraManaged = key;
  link.rel = rel;
  document.head.appendChild(link);

  return link;
};

const ensureMetaElement = (key: string, name: string): HTMLMetaElement => {
  const selector = `meta[data-datara-managed="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);

  if (existing) {
    existing.name = name;
    return existing;
  }

  const matchingName = document.head.querySelector<HTMLMetaElement>(
    `meta[name="${name}"]`
  );

  if (matchingName) {
    matchingName.dataset.dataraManaged = key;
    matchingName.name = name;
    return matchingName;
  }

  const meta = document.createElement("meta");
  meta.dataset.dataraManaged = key;
  meta.name = name;
  document.head.appendChild(meta);

  return meta;
};

/**
 * When the browser restores a page from its back/forward cache (bfcache) -
 * e.g. hitting Back after signing in or out - it revives the exact frozen
 * tab state from before navigation instead of remounting the app. That
 * leaves stale React state, stuck-open menus, and form fields on screen
 * that no longer match reality (auth cookies may have changed, settings may
 * have changed, etc.), and typing into a frozen form can visibly garble as
 * it collides with browser autofill. Forcing a reload on bfcache restores
 * guarantees every Back/Forward navigation gets a fresh, consistent app
 * state instead of a stale snapshot.
 */
function useBfcacheReload() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);
}

export default function Providers({ children }: { children: React.ReactNode }) {
  useBfcacheReload();

  return (
    <SettingsProvider>
      <ThemeModeProvider>{children}</ThemeModeProvider>
    </SettingsProvider>
  );
}

const resolveThemeMode = (
  themePreference: Theme,
  prefersDarkMode: boolean
): "dark" | "light" => {
  if (themePreference === "SYSTEM") {
    return prefersDarkMode ? "dark" : "light";
  }

  return themePreference === "DARK" ? "dark" : "light";
};
