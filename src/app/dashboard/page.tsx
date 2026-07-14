"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Login from "@/components/Login/login";
import DataRibbon from "@/components/Dashboard/DataRibbon/dataRibbon";
import TransactionsBottomRow from "@/components/Dashboard/TransactionsBottomRow/TransactionsBottomRow";
import TransactionsPerDay from "@/components/Dashboard/TransactionsPerDay/TransactionsPerDay";
import Footer from "@/components/Footer/Footer";
import {
  getDashboardPanels,
  type DashboardPanels,
} from "@/lib/api/dashboard";
import { reportApiError, useHasAuthToken } from "@/lib/api/client";
import { useDemoMode } from "@/lib/demoMode";
import { type DefaultTimeRange, useUserSettings } from "@/lib/api/settings";
import { useEffect, useState } from "react";
import scss from "./Dashboard.module.scss";

const forecastRangeLabels: Record<DefaultTimeRange, string> = {
  LAST_30_DAYS: "Last 30 Days",
  LAST_90_DAYS: "Last 90 Days",
  LAST_12_MONTHS: "Last 12 Months",
};

export default function Home() {
  const isDemoMode = useDemoMode();
  const hasAuthToken = useHasAuthToken();
  const { settings } = useUserSettings();
  const compactMode = settings?.compactMode ?? false;
  const timeRange = settings?.defaultTimeRange ?? "LAST_12_MONTHS";
  const canLoadDashboardPanels = isDemoMode || hasAuthToken;
  const [dashboardPanels, setDashboardPanels] =
    useState<DashboardPanels | null>(null);

  useEffect(() => {
    if (!canLoadDashboardPanels) {
      return;
    }

    let isMounted = true;
    setDashboardPanels(null);

    getDashboardPanels(timeRange)
      .then((panels) => {
        if (isMounted && isDashboardPanelsUsable(panels)) {
          setDashboardPanels(panels);
        }
      })
      .catch((error) => {
        reportApiError(error, "Dashboard panels");
      });

    return () => {
      isMounted = false;
    };
  }, [canLoadDashboardPanels, timeRange]);

  if (!isDemoMode && !hasAuthToken) {
    return <Login />;
  }

  const forecastLabel =
    dashboardPanels?.forecastActive.forecastLabel ?? forecastRangeLabels[timeRange];

  return (
    <Box
      component="main"
      className={`${scss.dashboardPage} ${compactMode ? scss.compact : ""}`}
      data-compact-mode={compactMode}
    >
      <section
        className={`${scss.dashboardHero} ${compactMode ? scss.compact : ""}`}
      >
        <div className={scss.heroCopy}>
          <Typography className={scss.eyebrow}>Revenue analytics</Typography>
          <Typography variant="h3" component="h1">
            Executive Overview
          </Typography>
          <Typography className={scss.heroText}>
          Track revenue performance, conversion trends, and pipeline activity in one centralized dashboard
          </Typography>
        </div>

        <div className={scss.heroPanel} aria-label="Forecast status">
          <span className={scss.statusDot} aria-hidden="true" />
          <span className={scss.statusLabel}>
            {`Forecast active \u00b7 ${forecastLabel}`}
          </span>
          <p className={scss.heroPanelValue}>
            {dashboardPanels?.forecastActive.formattedForecastRevenue ?? "--"}
          </p>
          <p className={scss.heroPanelText}>
            {dashboardPanels?.forecastActive.forecastDescription ?? "--"}
          </p>
        </div>
      </section>

      <div className={scss.dashboardStack}>
        <DataRibbon compactMode={compactMode} range={timeRange} />
        <TransactionsPerDay
          compactMode={compactMode}
          pipelineMetrics={dashboardPanels?.pipelineMetrics}
          range={timeRange}
        />
        <TransactionsBottomRow compactMode={compactMode} range={timeRange} />
      </div>

      <Footer />
    </Box>
  );
}

const isDashboardPanelsUsable = (
  panels: DashboardPanels | null | undefined
): panels is DashboardPanels => {
  return Boolean(
    panels?.forecastActive &&
      typeof panels.forecastActive.formattedForecastRevenue === "string" &&
      typeof panels.forecastActive.forecastDescription === "string" &&
      Array.isArray(panels.pipelineMetrics)
  );
};
