import { Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ChartConfiguration } from "chart.js";
import type { CSSProperties } from "react";
import DataChart from "@/components/DataChart/DataChart";
import scss from "./DataCard.module.scss";

export type KpiCardChart =
  | {
      data: ChartConfiguration<"bar">["data"];
      options?: ChartConfiguration<"bar">["options"];
      type: "bar";
    }
  | {
      data: ChartConfiguration<"line">["data"];
      options?: ChartConfiguration<"line">["options"];
      type: "line";
    };

export type DataCardProps = {
  accent: string;
  chart: KpiCardChart;
  compact?: boolean;
  context: string;
  title: string;
  trendLabel: string;
  value: string;
};

const DataCard = ({
  accent,
  chart,
  compact = false,
  context,
  title,
  trendLabel,
  value,
}: DataCardProps) => {
  const theme = useTheme();

  return (
    <Paper
      className={`${scss.dataCard} ${compact ? scss.compact : ""} ${title === "Net Revenue" ? scss.netRevenueCard : ""} ${title === "Win Rate" ? scss.winRateCard : ""}`}
      component="article"
      style={{ "--data-card-accent": accent } as CSSProperties}
      sx={{
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        boxShadow:
          theme.palette.mode === "dark"
            ? "0 10px 24px rgba(0, 0, 0, 0.18)"
            : "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div className={scss.cardHeader}>
        <h2 className={scss.label}>{title}</h2>
      </div>

      <div className={scss.metricBlock}>
        <p className={scss.value}>{value}</p>
        <div
          aria-label={`${title} 12-month trend`}
          className={`${scss.sparkline} ${isAreaChart(chart) ? scss.areaSparkline : ""} ${chart.type === "bar" ? scss.barSparkline : ""}`}
        >
          {renderKpiChart(chart, compact)}
        </div>
      </div>

      <div className={scss.contextRow}>
        <p className={scss.context}>{context}</p>
        <p className={scss.trendLabel}>{trendLabel}</p>
      </div>
    </Paper>
  );
};

const renderKpiChart = (chart: KpiCardChart, compact: boolean) => {
  const minHeight = getChartHeight(chart, compact);

  switch (chart.type) {
    case "bar":
      return (
        <div className={scss.chartSurface}>
          <DataChart
            data={chart.data}
            minHeight={minHeight}
            options={chart.options}
            type="bar"
          />
        </div>
      );
    case "line":
      return (
        <div className={scss.chartSurface}>
          <DataChart
            data={chart.data}
            minHeight={minHeight}
            options={chart.options}
            type="line"
          />
        </div>
      );
  }
};

const getChartHeight = (chart: KpiCardChart, compact: boolean): number => {
  if (isAreaChart(chart)) {
    return compact ? 78 : 92;
  }

  return compact ? 82 : 96;
};

const isAreaChart = (chart: KpiCardChart): boolean => {
  return (
    chart.type === "line" &&
    chart.data.datasets.some((dataset) => dataset.fill === true)
  );
};

export default DataCard;
