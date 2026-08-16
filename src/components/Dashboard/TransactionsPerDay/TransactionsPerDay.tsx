"use client";

import NorthEastIcon from "@mui/icons-material/NorthEast";
import RemoveIcon from "@mui/icons-material/Remove";
import SouthEastIcon from "@mui/icons-material/SouthEast";
import { Grid, Paper, Typography } from "@mui/material";
import type { ChartConfiguration } from "chart.js";
import DataChart from "@/components/DataChart/DataChart";
import { forecastTrend, revenueTrend } from "@/lib/api/analytics";
import {
  normalizeChartData,
  reportSettledApiError,
  type ChartData as ApiChartData,
} from "@/lib/api/client";
import type { PipelineMetric } from "@/lib/api/dashboard";
import type { DefaultTimeRange } from "@/lib/api/settings";
import { useEffect, useState } from "react";
import scss from "./TransactionsPerDay.module.scss";

type LineChartData = ChartConfiguration<"line">["data"];

const revenueTrendOptions: ChartConfiguration["options"] = {
  interaction: {
    intersect: false,
    mode: "index",
  },
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      ticks: {
        callback: (value: string | number) => `$${value}K`,
      },
    },
  },
};

const loadingInsightMetrics: PipelineMetric[] = [
  {
    key: "qualifiedPipeline",
    label: "Qualified pipeline",
    value: "--",
    change: "--",
    context: "Loading range data",
  },
  {
    key: "salesCycle",
    label: "Sales cycle",
    value: "--",
    change: "--",
    context: "Loading range data",
  },
  {
    key: "expansionRevenue",
    label: "Expansion revenue",
    value: "--",
    change: "--",
    context: "Loading range data",
  },
];

const emptyRevenueTrendData: LineChartData = {
  labels: [],
  datasets: [
    {
      label: "Net revenue",
      data: [],
      borderColor: "#14b8a6",
      backgroundColor: "rgba(20, 184, 166, 0.08)",
      borderWidth: 3,
      fill: true,
      pointBackgroundColor: "#ffffff",
      pointBorderColor: "#14b8a6",
      pointBorderWidth: 2,
      pointHoverRadius: 5,
      pointRadius: 3,
      tension: 0.38,
    },
    {
      label: "Forecast",
      data: [],
      borderColor: "#f59e0b",
      borderDash: [6, 6],
      borderWidth: 2,
      fill: false,
      pointRadius: 0,
      tension: 0.36,
    },
  ],
};

type TransactionsPerDayProps = {
  compactMode?: boolean;
  pipelineMetrics?: PipelineMetric[];
  range?: DefaultTimeRange;
};

const rangeLabels: Record<DefaultTimeRange, string> = {
  LAST_30_DAYS: "Last 30 Days",
  LAST_90_DAYS: "Last 90 Days",
  LAST_12_MONTHS: "Last 12 Months",
};

const pipelineAccentClassNames: Record<
  string,
  "amberAccent" | "cyanAccent" | "emeraldAccent"
> = {
  qualifiedPipeline: "cyanAccent",
  salesCycle: "emeraldAccent",
  expansionRevenue: "amberAccent",
};

const TransactionsPerDay = ({
  compactMode = false,
  pipelineMetrics,
  range,
}: TransactionsPerDayProps) => {
  const selectedRange = range ?? "LAST_12_MONTHS";
  const insightMetrics = isPipelineMetricsUsable(pipelineMetrics)
    ? pipelineMetrics
    : loadingInsightMetrics;
  const [chartData, setChartData] =
    useState<LineChartData>(emptyRevenueTrendData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadRevenueTrend = async () => {
      setIsLoading(true);

      const [revenueResponse, forecastResponse] = await Promise.allSettled([
        revenueTrend(selectedRange),
        forecastTrend(selectedRange),
      ]);

      if (!isMounted) {
        return;
      }

      reportSettledApiError(revenueResponse, "Revenue trend");
      reportSettledApiError(forecastResponse, "Forecast trend");

      const revenueData =
        revenueResponse.status === "fulfilled"
          ? normalizeChartData(revenueResponse.value)
          : undefined;
      const forecastData =
        forecastResponse.status === "fulfilled"
          ? normalizeChartData(forecastResponse.value)
          : undefined;
      const usableRevenueData = isChartResponseUsable(revenueData)
        ? revenueData
        : undefined;
      const usableForecastData = isChartResponseUsable(forecastData)
        ? forecastData
        : undefined;

      const revenueDataset = usableRevenueData?.datasets[0];
      const forecastDataset =
        findDataset(usableForecastData, "Predicted Revenue") ??
        usableForecastData?.datasets[0];
      const labels = usableRevenueData?.labels ?? usableForecastData?.labels ?? [];

      setChartData({
        ...emptyRevenueTrendData,
        labels,
        datasets: emptyRevenueTrendData.datasets.map((dataset, index) => {
          if (index === 0 && revenueDataset) {
            return {
              ...dataset,
              data: revenueDataset.data,
              label: revenueDataset.label || dataset.label,
            };
          }

          if (index === 1 && forecastDataset) {
            return {
              ...dataset,
              data: forecastDataset.data,
              label: forecastDataset.label || dataset.label,
            };
          }

          return dataset;
        }),
      });
      setIsLoading(false);
    };

    loadRevenueTrend();

    return () => {
      isMounted = false;
    };
  }, [selectedRange]);

  return (
    <Grid container className={scss.wrapper} spacing={compactMode ? 2 : 2.5}>
      <Grid size={12} sx={{ minWidth: 0, width: "100%" }}>
        <Paper className={`${scss.transactions} ${compactMode ? scss.compact : ""}`}>
          <div className={scss.chartHeader}>
            <div>
              <Typography className={scss.kicker}>Revenue Trend</Typography>
              <Typography className={scss.title} component="h2">
              Revenue growth is outperforming projections
              </Typography>
            </div>
            <span className={scss.period}>{rangeLabels[selectedRange]}</span>
          </div>

          <div className={scss.chartBody}>
            <div aria-busy={isLoading} className={scss.chart}>
              <DataChart
                data={chartData}
                options={revenueTrendOptions}
                type="line"
              />
            </div>

            <aside className={scss.insightRail} aria-label="Revenue trend highlights">
              <h3 className={scss.railTitle}>Pipeline metrics</h3>
              {insightMetrics.map((metric) => (
                <div
                  className={`${scss.insightItem} ${getPipelineAccentClassName(metric.key)}`}
                  key={metric.key}
                >
                  <div>
                    <h4 className={scss.insightLabel}>{metric.label}</h4>
                    <p className={scss.insightContext}>
                      {metric.context}
                    </p>
                  </div>
                  <div className={scss.insightNumbers}>
                    <p className={scss.insightValue}>{metric.value}</p>
                    <span
                      className={`${scss.insightChange} ${scss[getInsightChangeTone(metric.change)]}`}
                    >
                      <InsightChangeIcon change={metric.change} />
                      {metric.change}
                    </span>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </Paper>
      </Grid>
    </Grid>
  );
};

const getPipelineAccentClassName = (metricKey: string) => {
  const accentClassName = pipelineAccentClassNames[metricKey] ?? "cyanAccent";

  return scss[accentClassName];
};

const getInsightChangeTone = (
  change: string
): "negativeChange" | "neutralChange" | "positiveChange" => {
  if (change.trim().startsWith("-")) {
    return "negativeChange";
  }

  if (change.trim().startsWith("+")) {
    return "positiveChange";
  }

  return "neutralChange";
};

const InsightChangeIcon = ({ change }: { change: string }) => {
  if (change.trim().startsWith("-")) {
    return <SouthEastIcon aria-hidden="true" fontSize="inherit" />;
  }

  if (change.trim().startsWith("+")) {
    return <NorthEastIcon aria-hidden="true" fontSize="inherit" />;
  }

  return <RemoveIcon aria-hidden="true" fontSize="inherit" />;
};

const isChartResponseUsable = (
  response: ApiChartData | undefined
): response is ApiChartData => {
  return Boolean(
    response?.labels.length &&
      response.datasets.some((dataset) => dataset.data.length > 0)
  );
};

const findDataset = (
  response: ApiChartData | undefined,
  label: string
): ApiChartData["datasets"][number] | undefined => {
  return response?.datasets.find(
    (dataset) => dataset.label.toLowerCase() === label.toLowerCase()
  );
};

const isPipelineMetricsUsable = (
  metrics: PipelineMetric[] | undefined
): metrics is PipelineMetric[] => {
  return Boolean(
    metrics?.length &&
      metrics.every((metric) =>
        Boolean(metric.key && metric.label && metric.value && metric.change && metric.context)
      )
  );
};

export default TransactionsPerDay;
