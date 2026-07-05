"use client";

import { useEffect, useRef } from "react";
import { Chart, ChartConfiguration, registerables } from "chart.js";
import type { ChartTypeRegistry } from "chart.js";
import { darkOptions, lightOptions } from "@/components/DataChart/Themes";
import { useTheme } from "@mui/material/styles";

Chart.register(...registerables);

type ChartOptions<TType extends keyof ChartTypeRegistry> = NonNullable<
  ChartConfiguration<TType>["options"]
>;

const mergeChartOptions = <TType extends keyof ChartTypeRegistry>(
  base?: ChartConfiguration<TType>["options"],
  override?: ChartConfiguration<TType>["options"]
): ChartOptions<TType> => {
  const baseOptions = (base ?? {}) as ChartOptions<TType>;
  const overrideOptions = (override ?? {}) as ChartOptions<TType>;
  const hasScales = Boolean(baseOptions.scales || overrideOptions.scales);

  return {
    ...baseOptions,
    ...overrideOptions,
    plugins: {
      ...baseOptions.plugins,
      ...overrideOptions.plugins,
      legend: {
        ...baseOptions.plugins?.legend,
        ...overrideOptions.plugins?.legend,
        labels: {
          ...baseOptions.plugins?.legend?.labels,
          ...overrideOptions.plugins?.legend?.labels,
        },
      },
      tooltip: {
        ...baseOptions.plugins?.tooltip,
        ...overrideOptions.plugins?.tooltip,
      },
    },
    ...(hasScales && {
      scales: {
        ...baseOptions.scales,
        ...overrideOptions.scales,
        x: {
          ...((baseOptions.scales?.x ?? {}) as object),
          ...((overrideOptions.scales?.x ?? {}) as object),
        },
        y: {
          ...((baseOptions.scales?.y ?? {}) as object),
          ...((overrideOptions.scales?.y ?? {}) as object),
        },
      },
    }),
  } as ChartOptions<TType>;
};

type DataChartProps<TType extends keyof ChartTypeRegistry> = {
  type: TType;
  data: ChartConfiguration<TType>["data"];
  options?: ChartConfiguration<TType>["options"];
  plugins?: ChartConfiguration<TType>["plugins"];
};

const DataChart = <TType extends keyof ChartTypeRegistry>({
  data,
  options,
  plugins,
  type,
}: DataChartProps<TType>) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart<TType> | null>(null);
  const latestDataRef = useRef(data);
  const theme = useTheme();
  const minHeight = type === "doughnut" || type === "pie" ? 224 : 332;

  useEffect(() => {
    latestDataRef.current = data;

    const chart = chartInstanceRef.current;

    if (!chart) return;

    chart.data = data;
    chart.update();
  }, [data]);

  useEffect(() => {
    const canvas = chartRef.current;

    if (!canvas) return;

    destroyChart(chartInstanceRef.current);

    const chart = new Chart<TType>(canvas, {
      data: latestDataRef.current,
      options: buildChartOptions(theme.palette.mode, type, options),
      plugins,
      type,
    });

    chartInstanceRef.current = chart;

    return () => {
      if (chartInstanceRef.current === chart) {
        chartInstanceRef.current = null;
      }

      destroyChart(chart);
    };
  }, [options, plugins, theme.palette.mode, type]);

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

const buildChartOptions = <TType extends keyof ChartTypeRegistry>(
  themeMode: "dark" | "light",
  type: TType,
  options?: ChartConfiguration<TType>["options"]
): ChartOptions<TType> => {
  const chartThemeOptions = themeMode === "dark" ? darkOptions : lightOptions;
  const baseThemeOptions = chartThemeOptions ?? {};
  const themedOptions =
    type === "doughnut" || type === "pie" || type === "polarArea"
      ? {
          color: baseThemeOptions.color,
          plugins: baseThemeOptions.plugins,
        }
      : baseThemeOptions;

  return {
    maintainAspectRatio: false,
    responsive: true,
    ...mergeChartOptions<TType>(
      (themedOptions ?? {}) as NonNullable<ChartConfiguration<TType>["options"]>,
      (options ?? {}) as NonNullable<ChartConfiguration<TType>["options"]>
    ),
  };
};

const destroyChart = (chart: { destroy: () => void } | null): void => {
  if (!chart) {
    return;
  }

  try {
    chart.destroy();
  } catch (error) {
    if (!isBenignCanvasCleanupError(error)) {
      throw error;
    }
  }
};

const isBenignCanvasCleanupError = (error: unknown): boolean => {
  return (
    error instanceof TypeError &&
    error.message.includes("removeChild")
  );
};

export default DataChart;
