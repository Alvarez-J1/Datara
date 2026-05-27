"use client";

import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Button,
  Chip,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import Footer from "@/components/Footer/Footer";
import { useSession } from "next-auth/react";
import { type ChangeEvent, useState } from "react";
import scss from "./Settings.module.scss";

type SettingsState = {
  anomalyAlerts: boolean;
  autoTheme: boolean;
  compactMode: boolean;
  customers: boolean;
  emailDigest: boolean;
  orders: boolean;
  profit: boolean;
  reducedMotion: boolean;
  revenue: boolean;
  weeklyReport: boolean;
};

type SettingItem = {
  description: string;
  key: keyof SettingsState;
  label: string;
};

const dashboardPreferences: SettingItem[] = [
  {
    description: "Show revenue and forecast progress on overview cards.",
    key: "revenue",
    label: "Revenue metrics",
  },
  {
    description: "Show profit and margin metrics in dashboard summaries.",
    key: "profit",
    label: "Profit insights",
  },
  {
    description: "Include order volume, average order value, and conversion details.",
    key: "orders",
    label: "Order analytics",
  },
  {
    description: "Show customer retention and account health metrics.",
    key: "customers",
    label: "Customer metrics",
  },
];

const notifications: SettingItem[] = [
  {
    description: "Receive a concise revenue summary at the start of each week.",
    key: "weeklyReport",
    label: "Weekly performance report",
  },
  {
    description: "Get alerts when revenue or conversion trends change sharply.",
    key: "anomalyAlerts",
    label: "Anomaly alerts",
  },
  {
    description: "Receive a weekly summary of account and pipeline activity.",
    key: "emailDigest",
    label: "Email digest",
  },
];

const appearance: SettingItem[] = [
  {
    description: "Reduce spacing in tables and cards for denser layouts.",
    key: "compactMode",
    label: "Compact dashboard density",
  },
  {
    description: "Match the dashboard theme to your system preference when available.",
    key: "autoTheme",
    label: "Use system theme",
  },
  {
    description: "Reduce interface animations and transitions.",
    key: "reducedMotion",
    label: "Reduce motion",
  },
];

const SettingRow = ({
  checked,
  description,
  label,
  name,
  onChange,
}: Omit<SettingItem, "key"> & {
  checked: boolean;
  name: keyof SettingsState;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className={scss.settingRow}>
    <div className={scss.settingCopy}>
      <Typography className={scss.settingLabel}>{label}</Typography>
      <Typography className={scss.settingDescription}>{description}</Typography>
    </div>
    <Switch
      checked={checked}
      name={name}
      onChange={onChange}
      slotProps={{ input: { "aria-label": label } }}
    />
  </div>
);

export default function Settings() {
  const { data: session } = useSession();
  const theme = useTheme();
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<SettingsState>({
    anomalyAlerts: true,
    autoTheme: false,
    compactMode: false,
    customers: true,
    emailDigest: false,
    orders: true,
    profit: true,
    reducedMotion: false,
    revenue: true,
    weeklyReport: true,
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target;

    setSaved(false);
    setSettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = () => {
    setSaved(true);
    console.log("Settings saved:", settings);
  };

  const activeDashboardSignals = dashboardPreferences.filter(
    (item) => settings[item.key]
  ).length;

  return (
    <main className={scss.settingsPage}>
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
              size="small"
              variant="outlined"
            />
          )}
          <Button
            className={scss.saveButton}
            onClick={handleSubmit}
            startIcon={<SaveOutlinedIcon />}
            variant="contained"
          >
            Save changes
          </Button>
        </div>
      </section>

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
                {session?.user?.name ?? "Datara user"}
              </Typography>
              <Typography className={scss.profileEmail}>
                {session?.user?.email ?? "No email available"}
              </Typography>
            </div>
    
          </div>

          <div className={scss.summaryGrid}>
            <div>
              <Typography className={scss.summaryValue}>
                {activeDashboardSignals}/4
              </Typography>
              <Typography className={scss.summaryLabel}>Signals enabled</Typography>
            </div>
            <div>
              <Typography className={scss.summaryValue}>Weekly</Typography>
              <Typography className={scss.summaryLabel}>Reporting cadence</Typography>
            </div>
          </div>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span className={scss.cardIcon}>
              <SpaceDashboardOutlinedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Dashboard Preferences
              </Typography>
              <Typography className={scss.cardDescription}>
              Choose which metrics appear across the dashboard.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            {dashboardPreferences.map((item) => (
              <SettingRow
                {...item}
                checked={settings[item.key]}
                name={item.key}
                onChange={handleChange}
                key={item.key}
              />
            ))}
          </div>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span className={scss.cardIcon}>
              <NotificationsNoneRoundedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Notifications
              </Typography>
              <Typography className={scss.cardDescription}>
              Manage alerts and update notifications.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            {notifications.map((item) => (
              <SettingRow
                {...item}
                checked={settings[item.key]}
                name={item.key}
                onChange={handleChange}
                key={item.key}
              />
            ))}
          </div>
        </Paper>

        <Paper
          className={scss.settingsCard}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <div className={scss.cardHeader}>
            <span className={scss.cardIcon}>
              <PaletteOutlinedIcon fontSize="small" />
            </span>
            <div>
              <Typography className={scss.cardTitle} component="h2">
                Appearance & Theming
              </Typography>
              <Typography className={scss.cardDescription}>
              Customize dashboard appearance and motion preferences.
              </Typography>
            </div>
          </div>

          <div className={scss.settingList}>
            {appearance.map((item) => (
              <SettingRow
                {...item}
                checked={settings[item.key]}
                name={item.key}
                onChange={handleChange}
                key={item.key}
              />
            ))}
          </div>
        </Paper>
      </section>

      <Footer />
    </main>
  );
}
