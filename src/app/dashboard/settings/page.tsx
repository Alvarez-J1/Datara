"use client";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Button,
  Chip,
  MenuItem,
  Paper,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Footer from "@/components/Footer/Footer";
import { ApiError, useAuthUser } from "@/lib/api/client";
import {
  useSettingsActions,
  useUserSettings,
  type UserSettings,
} from "@/lib/api/settings";
import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import scss from "./Settings.module.scss";

type SettingsFormState = {
  anomalyAlerts: boolean;
  compactMode: boolean;
  defaultTimeRange: UserSettings["defaultTimeRange"];
  emailDigest: boolean;
  tablePageSize: string;
  theme: UserSettings["theme"];
  weeklyReport: boolean;
};

const DEFAULT_FORM_STATE: SettingsFormState = {
  anomalyAlerts: true,
  compactMode: false,
  defaultTimeRange: "LAST_12_MONTHS",
  emailDigest: false,
  tablePageSize: "25",
  theme: "SYSTEM",
  weeklyReport: true,
};

const toFormState = (settings: UserSettings): SettingsFormState => ({
  anomalyAlerts: settings.anomalyAlerts,
  compactMode: settings.compactMode,
  defaultTimeRange: settings.defaultTimeRange,
  emailDigest: settings.emailDigest,
  tablePageSize: String(settings.tablePageSize),
  theme: settings.theme,
  weeklyReport: settings.weeklyReport,
});

const toApiPayload = (formState: SettingsFormState): UserSettings => ({
  anomalyAlerts: formState.anomalyAlerts,
  compactMode: formState.compactMode,
  defaultTimeRange: formState.defaultTimeRange,
  emailDigest: formState.emailDigest,
  tablePageSize: Number(formState.tablePageSize) as UserSettings["tablePageSize"],
  theme: formState.theme,
  weeklyReport: formState.weeklyReport,
});

const themeLabels: Record<UserSettings["theme"], string> = {
  DARK: "Dark",
  LIGHT: "Light",
  SYSTEM: "System",
};

type ToggleKey = "anomalyAlerts" | "compactMode" | "emailDigest" | "weeklyReport";

type ToggleItem = {
  description: string;
  key: ToggleKey;
  label: string;
};

const notifications: ToggleItem[] = [
  {
    description: "Save your preference for weekly performance report emails.",
    key: "weeklyReport",
    label: "Weekly performance report",
  },
  {
    description: "Save your preference for periodic email summaries.",
    key: "emailDigest",
    label: "Email digest",
  },
  {
    description: "Save your preference for anomaly notifications.",
    key: "anomalyAlerts",
    label: "Anomaly alerts",
  },
];

const FieldRow = ({
  children,
  description,
  label,
}: {
  children: ReactNode;
  description: string;
  label: string;
}) => (
  <div className={scss.settingRow}>
    <div className={scss.settingCopy}>
      <Typography className={scss.settingLabel}>{label}</Typography>
      <Typography className={scss.settingDescription}>{description}</Typography>
    </div>
    {children}
  </div>
);

const ToggleRow = ({
  checked,
  description,
  disabled,
  label,
  name,
  onChange,
}: Omit<ToggleItem, "key"> & {
  checked: boolean;
  disabled?: boolean;
  name: ToggleKey;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <FieldRow description={description} label={label}>
    <Switch
      checked={checked}
      disabled={disabled}
      name={name}
      onChange={onChange}
      slotProps={{ input: { "aria-label": label } }}
    />
  </FieldRow>
);

export default function Settings() {
  const authUser = useAuthUser();
  const theme = useTheme();
  const {
    error: settingsLoadError,
    isLoading: isSettingsLoading,
    settings,
  } = useUserSettings();
  const { setThemePreference, updateSettings } = useSettingsActions();
  const hasHydratedForm = useRef(false);

  const [formState, setFormState] = useState<SettingsFormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    if (!hasHydratedForm.current) {
      hasHydratedForm.current = true;
      setFormState(toFormState(settings));
      return;
    }

    setFormState((current) => ({
      ...current,
      theme: settings.theme,
    }));
  }, [settings]);

  const isLoading = isSettingsLoading;
  const isEditable = !isLoading;
  const controlsDisabled = !isEditable || isSaving;

  const handleToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    setSaved(false);
    setFormState((prev) => ({ ...prev, [name]: checked }));
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setSaved(false);

    if (name === "theme") {
      const nextTheme = value as UserSettings["theme"];

      setSaveError("");
      setFormState((prev) => ({ ...prev, theme: nextTheme }));
      setIsSaving(true);

      setThemePreference(nextTheme)
        .then((updated) => {
          setFormState((prev) => ({
            ...prev,
            theme: updated.theme,
          }));
          setSaved(true);
        })
        .catch((error) => {
          setSaveError(
            error instanceof ApiError
              ? error.message
              : "Unable to save your theme preference. Please try again."
          );
          setFormState((prev) => ({
            ...prev,
            theme: settings?.theme ?? DEFAULT_FORM_STATE.theme,
          }));
        })
        .finally(() => {
          setIsSaving(false);
        });

      return;
    }

    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!isEditable) {
      return;
    }

    setSaved(false);
    setSaveError("");
    setIsSaving(true);

    try {
      const updated = await updateSettings(toApiPayload(formState));
      setFormState(toFormState(updated));
      setSaved(true);
    } catch (error) {
      setSaveError(
        error instanceof ApiError
          ? error.message
          : "Unable to save your settings. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "8px",
      transition: "box-shadow 160ms ease, border-color 160ms ease",
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.secondary.main, 0.55),
      },
      "&.Mui-focused": {
        boxShadow: `0 0 0 3px ${alpha(theme.palette.secondary.main, 0.1)}`,
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.secondary.main,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: theme.palette.secondary.main,
    },
  };

  const enabledNotificationCount = [
    formState.weeklyReport,
    formState.emailDigest,
    formState.anomalyAlerts,
  ].filter(Boolean).length;

  return (
    <main
      className={`${scss.settingsPage} ${formState.compactMode ? scss.compact : ""}`}
      data-compact-mode={formState.compactMode}
    >
      <section className={scss.pageHeader}>
        <div>
          <Typography className={scss.eyebrow}>Workspace controls</Typography>
          <Typography component="h1" variant="h3">
            Settings
          </Typography>
          <Typography className={scss.pageDescription}>
          Tune your workspace preferences and dashboard settings.
          </Typography>
        </div>

        <div className={scss.headerActions}>
          {saved && (
            <Chip
              className={scss.savedChip}
              label="Changes saved"
              role="status"
              size="small"
              variant="outlined"
            />
          )}
          <Button
            className={scss.saveButton}
            disabled={controlsDisabled}
            onClick={handleSubmit}
            startIcon={<SaveOutlinedIcon aria-hidden="true" />}
            variant="contained"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </section>

      {settingsLoadError && (
        <Typography className={scss.saveErrorNotice} role="alert">
          {settingsLoadError}
        </Typography>
      )}

      {saveError && (
        <Typography className={scss.saveErrorNotice} role="alert">
          {saveError}
        </Typography>
      )}

      <section className={scss.settingsGrid} aria-label="Datara settings">
        <Paper
          className={`${scss.settingsCard} ${scss.generalCard}`}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 10px 24px rgba(0, 0, 0, 0.18)"
                : "0 10px 24px rgba(15, 23, 42, 0.05)",
          }}
        >
          <div className={scss.cardHeader}>
            <span
              aria-hidden="true"
              className={scss.cardIcon}
              style={{
                backgroundColor: alpha(theme.palette.secondary.main, 0.07),
                color: theme.palette.secondary.main,
              }}
            >
              <TuneRoundedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                General Settings
              </Typography>
              <Typography className={scss.cardDescription}>
                Account context and workspace status.
              </Typography>
            </div>
          </div>

          <div className={scss.profilePanel}>
            <div>
              <Typography className={scss.profileLabel}>Signed in as</Typography>
              <Typography className={scss.profileName}>
                {authUser?.name ?? "Datara user"}
              </Typography>
              <Typography className={scss.profileEmail}>
                {authUser?.email ?? "No email available"}
              </Typography>
            </div>
          </div>

          <div className={scss.summaryGrid}>
            <div>
              <Typography className={scss.summaryValue}>
                {enabledNotificationCount}/3
              </Typography>
              <Typography className={scss.summaryLabel}>
                Notifications enabled
              </Typography>
            </div>
            <div>
              <Typography className={scss.summaryValue}>
                {themeLabels[formState.theme]}
              </Typography>
              <Typography className={scss.summaryLabel}>Active theme</Typography>
            </div>
          </div>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span aria-hidden="true" className={scss.cardIcon}>
              <SpaceDashboardOutlinedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Dashboard Preferences
              </Typography>
              <Typography className={scss.cardDescription}>
              Defaults applied across dashboard views and tables.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            <FieldRow
              description="Default lookback window for dashboard charts and KPI comparisons."
              label="Default time range"
            >
              <TextField
                className={scss.settingSelect}
                disabled={controlsDisabled}
                name="defaultTimeRange"
                onChange={handleFieldChange}
                select
                size="small"
                slotProps={{ input: { "aria-label": "Default time range" } }}
                sx={fieldStyles}
                value={formState.defaultTimeRange}
              >
                <MenuItem value="LAST_30_DAYS">Last 30 days</MenuItem>
                <MenuItem value="LAST_90_DAYS">Last 90 days</MenuItem>
                <MenuItem value="LAST_12_MONTHS">Last 12 months</MenuItem>
              </TextField>
            </FieldRow>

            <FieldRow
              description="Number of rows shown per page in the Revenue Data table."
              label="Table page size"
            >
              <TextField
                className={scss.settingSelect}
                disabled={controlsDisabled}
                name="tablePageSize"
                onChange={handleFieldChange}
                select
                size="small"
                slotProps={{ input: { "aria-label": "Table page size" } }}
                sx={fieldStyles}
                value={formState.tablePageSize}
              >
                <MenuItem value="25">25 rows</MenuItem>
                <MenuItem value="50">50 rows</MenuItem>
                <MenuItem value="100">100 rows</MenuItem>
              </TextField>
            </FieldRow>

            <ToggleRow
              checked={formState.compactMode}
              description="Reduce spacing in tables and cards for denser layouts."
              disabled={controlsDisabled}
              label="Compact mode"
              name="compactMode"
              onChange={handleToggleChange}
            />
          </div>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span aria-hidden="true" className={scss.cardIcon}>
              <NotificationsNoneRoundedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Notifications
              </Typography>
              <Typography className={scss.cardDescription}>
                Manage saved notification preferences.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            {notifications.map((item) => (
              <ToggleRow
                {...item}
                checked={formState[item.key]}
                disabled={controlsDisabled}
                name={item.key}
                onChange={handleToggleChange}
                key={item.key}
              />
            ))}
          </div>

          <Typography className={scss.notificationHelper}>
            Notification delivery is not enabled in this demo. These preferences
            are saved to your account and would control email notifications in a
            production deployment.
          </Typography>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span aria-hidden="true" className={scss.cardIcon}>
              <PaletteOutlinedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Appearance & Theming
              </Typography>
              <Typography className={scss.cardDescription}>
              Customize how the Datara workspace looks.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            <FieldRow description="Choose how Datara looks on this device." label="Theme">
              <TextField
                className={scss.settingSelect}
                disabled={controlsDisabled}
                name="theme"
                onChange={handleFieldChange}
                select
                size="small"
                slotProps={{ input: { "aria-label": "Theme" } }}
                sx={fieldStyles}
                value={formState.theme}
              >
                <MenuItem value="LIGHT">Light</MenuItem>
                <MenuItem value="DARK">Dark</MenuItem>
                <MenuItem value="SYSTEM">System</MenuItem>
              </TextField>
            </FieldRow>
          </div>
        </Paper>
      </section>

      <Footer />
    </main>
  );
}
