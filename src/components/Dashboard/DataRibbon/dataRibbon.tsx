"use client";

import { Grid } from "@mui/material";
import DataCard, { type DataCardProps } from "@/components/Dashboard/DataCard/DataCard";
import {
  getDashboardSummary,
  type DashboardSummary,
  type KpiMetric,
} from "@/lib/api/dashboard";
import { reportApiError } from "@/lib/api/client";
import type { DefaultTimeRange } from "@/lib/api/settings";
import { useEffect, useMemo, useState } from "react";
import scss from "./DataRibbon.module.scss";

const COMPARISON_LABELS: Record<DefaultTimeRange, string> = {
  LAST_30_DAYS: "Compared to prior 30 days",
  LAST_90_DAYS: "Compared to prior 90 days",
  LAST_12_MONTHS: "Compared to prior 12 months",
};
const DEFAULT_COMPARISON_SUBTEXT = "Compared to prior period";

type CardKind = "currency" | "integer" | "percent";

type CardDefinition = {
  accent: string;
  context: string;
  kind: CardKind;
  title: string;
};

const cardDefinitions: CardDefinition[] = [
  {
    accent: "#14b8a6",
    context: "Revenue from won deals",
    kind: "currency",
    title: "Net Revenue",
  },
  {
    accent: "#2563eb",
    context: "Active customer accounts",
    kind: "integer",
    title: "Customers",
  },
  {
    accent: "#f59e0b",
    context: "Average value of closed deals",
    kind: "currency",
    title: "Avg. Deal Size",
  },
  {
    accent: "#f43f5e",
    context: "Won deals as a share of closed deals",
    kind: "percent",
    title: "Win Rate",
  },
];

const getLoadingMetrics = (comparisonSubtext: string): DataCardProps[] =>
  cardDefinitions.map((definition) => ({
    accent: definition.accent,
    context: definition.context,
    description: definition.context,
    title: definition.title,
    trend: "--",
    trendLabel: comparisonSubtext,
    trendTone: "neutral",
    value: "--",
  }));

type DataRibbonProps = {
  compactMode?: boolean;
  range?: DefaultTimeRange;
};

const DataRibbon = ({ compactMode = false, range }: DataRibbonProps) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const comparisonSubtext = range ? COMPARISON_LABELS[range] : DEFAULT_COMPARISON_SUBTEXT;

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      setIsLoading(true);

      try {
        const dashboardSummary = await getDashboardSummary(range);

        if (!isMounted) {
          return;
        }

        setSummary(dashboardSummary);
        setHasError(false);
      } catch (error) {
        reportApiError(error, "Dashboard summary");

        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const metrics = useMemo(
    () => getMetrics(summary, isLoading, hasError, comparisonSubtext),
    [summary, isLoading, hasError, comparisonSubtext]
  );

  return (
    <Grid
      aria-busy={isLoading}
      className={`${scss.dataRibbon} ${compactMode ? scss.compact : ""}`}
      container
      spacing={compactMode ? 2 : 2.5}
      sx={{ maxWidth: "100%", width: "100%" }}
    >
      {metrics.map((metric) => (
        <Grid key={metric.title} size={{ xs: 12, sm: 6, lg: 3 }}>
          <DataCard {...metric} compact={compactMode} />
        </Grid>
      ))}
    </Grid>
  );
};

const getMetrics = (
  summary: DashboardSummary | null,
  isLoading: boolean,
  hasError: boolean,
  comparisonSubtext: string
): DataCardProps[] => {
  if (isLoading) {
    return getLoadingMetrics(comparisonSubtext);
  }

  if (hasError || !summary || !isValidDashboardSummary(summary)) {
    return getLoadingMetrics(comparisonSubtext);
  }

  return cardDefinitions.map((definition) => {
    const kpi = kpiForCard(definition.title, summary);
    const { trend, trendTone } = formatDelta(kpi);

    return {
      accent: definition.accent,
      context: definition.context,
      description: definition.context,
      title: definition.title,
      trend,
      trendLabel: comparisonSubtext,
      trendTone,
      value: formatValue(definition.kind, kpi.currentValue),
    };
  });
};

/**
 * Guards against a stale/mismatched API response (e.g. a backend that hasn't
 * picked up the KPI comparison shape yet) so the dashboard falls back to the
 * loading state instead of throwing when a nested KPI is missing.
 */
const isValidDashboardSummary = (summary: DashboardSummary): boolean => {
  return Boolean(
    summary.netRevenue &&
      summary.customers &&
      summary.averageDealSize &&
      summary.winRate
  );
};

const kpiForCard = (title: string, summary: DashboardSummary): KpiMetric => {
  switch (title) {
    case "Net Revenue":
      return summary.netRevenue;
    case "Customers":
      return summary.customers;
    case "Avg. Deal Size":
      return summary.averageDealSize;
    case "Win Rate":
      return summary.winRate;
    default:
      throw new Error(`Unknown KPI card: ${title}`);
  }
};

/**
 * Renders the backend-computed month-over-month delta. `deltaPercent` is
 * `null` whenever there's no prior-period value to divide by (a brand new
 * account, or a metric with zero activity last month) - in that case we show
 * "New" or "--" instead of a fabricated percentage, Infinity, or NaN.
 */
const formatDelta = (
  kpi: KpiMetric
): { trend: string; trendTone: NonNullable<DataCardProps["trendTone"]> } => {
  if (kpi.deltaDirection === "NEW") {
    return { trend: "New", trendTone: "positive" };
  }

  if (kpi.deltaDirection === "NONE" || kpi.deltaPercent === null) {
    return { trend: "--", trendTone: "neutral" };
  }

  const magnitude = formatPercent(Math.abs(kpi.deltaPercent));

  // A raw delta can be a hair off zero (e.g. -0.02%) and still round to "0%"
  // at display precision. Showing a signed "-0%"/"+0%" in that case reads as
  // a bug, so once the displayed magnitude itself is zero, always render it
  // as a plain, neutral "0%" regardless of the raw UP/DOWN direction.
  if (isZeroMagnitude(magnitude)) {
    return { trend: "0%", trendTone: "neutral" };
  }

  if (kpi.deltaDirection === "UP") {
    return { trend: `+${magnitude}`, trendTone: "positive" };
  }

  if (kpi.deltaDirection === "DOWN") {
    return { trend: `-${magnitude}`, trendTone: "negative" };
  }

  return { trend: magnitude, trendTone: "neutral" };
};

const isZeroMagnitude = (formattedPercent: string): boolean => {
  const numericValue = Number(formattedPercent.replace("%", ""));
  return Number.isFinite(numericValue) && numericValue === 0;
};

const formatValue = (kind: CardKind, value: number): string => {
  switch (kind) {
    case "currency":
      return formatCurrency(value);
    case "integer":
      return formatInteger(value);
    case "percent":
      return formatPercent(value);
    default:
      return "--";
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: 1,
    notation: "compact",
    style: "currency",
  }).format(toFiniteNumber(value));
};

const formatInteger = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(toFiniteNumber(value));
};

const formatPercent = (value: number): string => {
  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(toFiniteNumber(value))}%`;
};

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

export default DataRibbon;
