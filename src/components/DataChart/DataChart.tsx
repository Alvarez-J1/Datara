"use client";

import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration, registerables } from "chart.js";
import { darkOptions, lightOptions } from "@/components/DataChart/Themes";
import { useTheme } from "@mui/material/styles";

Chart.register(...registerables);

const mergeChartOptions = (
  base: ChartConfiguration["options"] = {},
  override: ChartConfiguration["options"] = {}
): ChartConfiguration["options"] => {
  const hasScales = Boolean(base.scales || override.scales);

  return {
    ...base,
    ...override,
    plugins: {
      ...base.plugins,
      ...override.plugins,
      legend: {
        ...base.plugins?.legend,
        ...override.plugins?.legend,
        labels: {
          ...base.plugins?.legend?.labels,
          ...override.plugins?.legend?.labels,
        },
      },
      tooltip: {
        ...base.plugins?.tooltip,
        ...override.plugins?.tooltip,
      },
    },
    ...(hasScales && {
      scales: {
        ...base.scales,
        ...override.scales,
        x: {
          ...((base.scales?.x ?? {}) as object),
          ...((override.scales?.x ?? {}) as object),
        },
        y: {
          ...((base.scales?.y ?? {}) as object),
          ...((override.scales?.y ?? {}) as object),
        },
      },
    }),
  };
};

const DataChart = ({ data, options, plugins, type }: ChartConfiguration) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const minHeight = type === "doughnut" || type === "pie" ? 224 : 332;

  useEffect(() => {
    if (!chartRef.current) return;

    const chartThemeOptions =
      theme.palette.mode === "dark" ? darkOptions : lightOptions;
    const baseThemeOptions = chartThemeOptions ?? {};
    const themedOptions =
      type === "doughnut" || type === "pie" || type === "polarArea"
        ? {
            color: baseThemeOptions.color,
            plugins: baseThemeOptions.plugins,
          }
        : baseThemeOptions;

    const chart = new Chart(chartRef.current, {
      data,
      options: {
        maintainAspectRatio: false,
        responsive: true,
        ...mergeChartOptions(themedOptions, options),
      },
      plugins,
      type,
    });

    return () => {
      chart.destroy();
    };
  }, [data, options, plugins, theme.palette.mode, type]);

  return (
    <div
      style={{
        minHeight,
        minWidth: 0,
        position: "relative",
        width: "100%",
      }}
    >
      <canvas ref={chartRef} />
    </div>
  );
};

export default DataChart;
