"use client";

import { Grid } from "@mui/material";
import type {
  Chart,
  ChartConfiguration,
  ScriptableContext,
  TooltipModel,
} from "chart.js";
import DataCard, {
  type DataCardProps,
  type KpiCardChart,
} from "@/components/Dashboard/DataCard/DataCard";
import {
  getDashboardSummary,
  type DashboardSummary,
  type KpiMetric,
  type KpiTrendSeries,
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
const AVERAGE_DEAL_TOOLTIP_OFFSET = 10;
const AVERAGE_DEAL_TOOLTIP_MARGIN = 6;

type CardKind = "currency" | "integer" | "percent";

type CardDefinition = {
  accent: string;
  chartType: "area" | "bar";
  context: string;
  fillStrength?: "light" | "standard" | "strong";
  kind: CardKind;
  title: string;
};

const emptyTrendSeries: KpiTrendSeries = {
  data: [],
  labels: [],
};

const compactLineOptions: ChartConfiguration<"line">["options"] = {
  animation: {
    duration: 940,
    easing: "easeOutQuart",
  },
  elements: {
    line: {
      borderCapStyle: "round",
      borderJoinStyle: "round",
    },
    point: {
      hoverRadius: 3.5,
      radius: 0,
    },
  },
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      bodyFont: {
        size: 10,
        weight: 620,
      },
      callbacks: {
        label: formatCompactKpiTooltipLabel,
      },
      caretPadding: 4,
      caretSize: 4,
      cornerRadius: 6,
      displayColors: false,
      padding: {
        bottom: 5,
        left: 7,
        right: 7,
        top: 5,
      },
      titleFont: {
        size: 10,
        weight: 720,
      },
      titleMarginBottom: 4,
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      display: false,
      grid: {
        display: false,
      },
    },
  },
};

const compactBarOptions: ChartConfiguration<"bar">["options"] = {
  animation: {
    delay: (context) => context.dataIndex * 38,
    duration: 860,
    easing: "easeOutQuart",
  },
  interaction: {
    intersect: false,
    mode: "nearest",
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      enabled: false,
      external: renderAverageDealSizeTooltip,
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      display: false,
      grace: "0%",
      grid: {
        display: false,
      },
    },
  },
};

const buildKpiLineChart = ({
  color,
  fill = false,
  fillStrength = "standard",
  label,
  trend,
}: {
  color: string;
  fill?: boolean;
  fillStrength?: "light" | "standard" | "strong";
  label: string;
  trend: KpiTrendSeries;
}): KpiCardChart => ({
  data: {
    labels: trend.labels,
    datasets: [
      {
        backgroundColor: fill
          ? buildAreaGradient(color, fillStrength)
          : "transparent",
        borderCapStyle: "round",
        borderColor: color,
        borderJoinStyle: "round",
        borderWidth: 2.35,
        data: trend.data,
        fill,
        label,
        tension: 0.44,
      },
    ],
  },
  options: compactLineOptions,
  type: "line",
});

const buildAreaGradient =
  (color: string, strength: "light" | "standard" | "strong") =>
  (context: ScriptableContext<"line">) => {
    const { chart } = context;
    const { chartArea, ctx } = chart;
    const alphaStops = areaGradientAlphaStops[strength];

    if (!chartArea) {
      return `${color}${alphaStops[1]}`;
    }

    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, `${color}${alphaStops[0]}`);
    gradient.addColorStop(0.72, `${color}${alphaStops[1]}`);
    gradient.addColorStop(1, `${color}${alphaStops[2]}`);

    return gradient;
  };

const areaGradientAlphaStops = {
  light: ["34", "16", "03"],
  standard: ["40", "1d", "04"],
  strong: ["52", "24", "05"],
} as const;

const buildKpiBarChart = ({
  color,
  label,
  trend,
}: {
  color: string;
  label: string;
  trend: KpiTrendSeries;
}): KpiCardChart => ({
  data: {
    labels: trend.labels,
    datasets: [
      {
        backgroundColor: buildBarBackgroundColor(color),
        barPercentage: 0.78,
        borderRadius: 7,
        borderSkipped: false,
        categoryPercentage: 0.86,
        data: trend.data,
        label,
        hoverBackgroundColor: `${color}f2`,
      },
    ],
  },
  options: compactBarOptions,
  type: "bar",
});

const buildBarBackgroundColor =
  (color: string) => (context: ScriptableContext<"bar">) => {
    const activeIndex = context.chart.tooltip?.getActiveElements()[0]?.index;

    if (activeIndex === undefined) {
      return `${color}d9`;
    }

    return context.dataIndex === activeIndex ? `${color}f2` : `${color}66`;
  };

function renderAverageDealSizeTooltip({
  chart,
  tooltip,
}: {
  chart: Chart;
  tooltip: TooltipModel<"bar">;
}) {
  const tooltipElements = getOrCreateAverageDealSizeTooltip(chart);

  if (!tooltipElements) {
    return;
  }

  const { container, parent, title, value } = tooltipElements;
  const activeElement = tooltip.getActiveElements()[0];
  const tooltipPoint = tooltip.dataPoints[0];

  if (tooltip.opacity === 0 || !activeElement || !tooltipPoint) {
    container.classList.remove(scss.averageDealSizeTooltipVisible);
    return;
  }

  title.textContent = formatTooltipMonth(tooltipPoint.label);
  value.textContent = `Average Deal Size: ${formatCurrency(
    toFiniteNumber(tooltipPoint.parsed.y)
  )}`;

  const canvasRect = chart.canvas.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const activePosition = activeElement.element.tooltipPosition(true);
  const anchorX =
    canvasRect.left - parentRect.left + toFiniteNumber(activePosition.x);
  const anchorY =
    canvasRect.top - parentRect.top + toFiniteNumber(activePosition.y);
  const tooltipWidth = container.offsetWidth;
  const tooltipHeight = container.offsetHeight;
  const maxLeft = parent.clientWidth - tooltipWidth - AVERAGE_DEAL_TOOLTIP_MARGIN;
  const maxTop = parent.clientHeight - tooltipHeight - AVERAGE_DEAL_TOOLTIP_MARGIN;
  const left = clamp(
    anchorX - tooltipWidth / 2,
    AVERAGE_DEAL_TOOLTIP_MARGIN,
    maxLeft
  );
  const top = clamp(
    anchorY - tooltipHeight - AVERAGE_DEAL_TOOLTIP_OFFSET,
    AVERAGE_DEAL_TOOLTIP_MARGIN,
    maxTop
  );

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
  container.classList.add(scss.averageDealSizeTooltipVisible);
}

const getOrCreateAverageDealSizeTooltip = (chart: Chart) => {
  const parent =
    chart.canvas.closest<HTMLElement>("article") ?? chart.canvas.parentElement;

  if (!parent) {
    return null;
  }

  let container = parent.querySelector<HTMLDivElement>(
    "[data-average-deal-size-tooltip]"
  );

  if (!container) {
    container = document.createElement("div");
    container.className = scss.averageDealSizeTooltip;
    container.dataset.averageDealSizeTooltip = "true";
    container.setAttribute("aria-hidden", "true");

    const title = document.createElement("span");
    title.className = scss.averageDealSizeTooltipMonth;
    title.dataset.averageDealSizeTooltipTitle = "true";

    const value = document.createElement("span");
    value.className = scss.averageDealSizeTooltipValue;
    value.dataset.averageDealSizeTooltipValue = "true";

    container.append(title, value);
    parent.appendChild(container);
  }

  const title = container.querySelector<HTMLSpanElement>(
    "[data-average-deal-size-tooltip-title]"
  );
  const value = container.querySelector<HTMLSpanElement>(
    "[data-average-deal-size-tooltip-value]"
  );

  if (!title || !value) {
    return null;
  }

  return { container, parent, title, value };
};

const formatTooltipMonth = (label: string): string => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const match = months.find((month) =>
    new RegExp(`\\b${month}\\b`, "i").test(label)
  );

  return match ?? label;
};

const clamp = (value: number, min: number, max: number): number => {
  const safeMax = Math.max(min, max);

  return Math.min(Math.max(value, min), safeMax);
};

function formatCompactKpiTooltipLabel({
  dataset,
  parsed,
}: {
  dataset: { label?: string };
  parsed: { y: number | null };
}): string {
  const label = dataset.label ?? "Value";
  const value = toFiniteNumber(parsed.y);

  if (label === "Customers") {
    return `${label}: ${formatInteger(value)}`;
  }

  if (label === "Win Rate") {
    return `${label}: ${formatPercent(value)}`;
  }

  return `${label}: ${formatCurrency(value)}`;
}

const cardDefinitions: CardDefinition[] = [
  {
    accent: "#22d3ee",
    chartType: "area",
    context: "Revenue from won deals",
    fillStrength: "strong",
    kind: "currency",
    title: "Net Revenue",
  },
  {
    accent: "#10b981",
    chartType: "area",
    context: "Active customer accounts",
    fillStrength: "light",
    kind: "integer",
    title: "Customers",
  },
  {
    accent: "#f59e0b",
    chartType: "bar",
    context: "Average value of closed deals",
    kind: "currency",
    title: "Avg. Deal Size",
  },
  {
    accent: "#a78bfa",
    chartType: "area",
    context: "Won deals as a share of closed deals",
    fillStrength: "standard",
    kind: "percent",
    title: "Win Rate",
  },
];

const buildKpiChart = (
  definition: CardDefinition,
  trend: KpiTrendSeries
): KpiCardChart => {
  if (definition.chartType === "bar") {
    return buildKpiBarChart({
      color: definition.accent,
      label: definition.title,
      trend,
    });
  }

  return buildKpiLineChart({
    color: definition.accent,
    fill: true,
    fillStrength: definition.fillStrength,
    label: definition.title,
    trend,
  });
};

const getLoadingMetrics = (comparisonSubtext: string): DataCardProps[] =>
  cardDefinitions.map((definition) => ({
    accent: definition.accent,
    chart: buildKpiChart(definition, emptyTrendSeries),
    context: definition.context,
    title: definition.title,
    trendLabel: comparisonSubtext,
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
    const trend = kpiTrendForCard(definition.title, summary);

    return {
      accent: definition.accent,
      chart: buildKpiChart(definition, trend),
      context: definition.context,
      title: definition.title,
      trendLabel: comparisonSubtext,
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
      isTrendSeriesUsable(summary.netRevenueTrend) &&
      summary.customers &&
      isTrendSeriesUsable(summary.customersTrend) &&
      summary.averageDealSize &&
      isTrendSeriesUsable(summary.averageDealSizeTrend) &&
      summary.winRate &&
      isTrendSeriesUsable(summary.winRateTrend)
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

const kpiTrendForCard = (
  title: string,
  summary: DashboardSummary
): KpiTrendSeries => {
  switch (title) {
    case "Net Revenue":
      return normalizeTrendSeries(summary.netRevenueTrend);
    case "Customers":
      return normalizeTrendSeries(summary.customersTrend);
    case "Avg. Deal Size":
      return normalizeTrendSeries(summary.averageDealSizeTrend);
    case "Win Rate":
      return normalizeTrendSeries(summary.winRateTrend);
    default:
      throw new Error(`Unknown KPI card: ${title}`);
  }
};

const normalizeTrendSeries = (
  trend: KpiTrendSeries | undefined
): KpiTrendSeries => ({
  labels: Array.isArray(trend?.labels) ? trend.labels.map(String) : [],
  data: Array.isArray(trend?.data) ? trend.data.map(toFiniteNumber) : [],
});

const isTrendSeriesUsable = (
  trend: KpiTrendSeries | undefined
): trend is KpiTrendSeries => {
  return Boolean(
    trend?.labels.length &&
      trend.data.length === trend.labels.length &&
      trend.data.every((value) => Number.isFinite(Number(value)))
  );
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
