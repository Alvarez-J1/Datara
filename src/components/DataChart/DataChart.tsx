"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import type {
  ActiveDataPoint,
  ChartConfiguration,
  ChartTypeRegistry,
  InteractionItem,
  InteractionMode,
  InteractionOptions,
  Point,
} from "chart.js";
import type { MutableRefObject } from "react";
import { darkOptions, lightOptions } from "@/components/DataChart/Themes";
import { useTheme } from "@mui/material/styles";

Chart.register(...registerables);

type ChartOptions<TType extends keyof ChartTypeRegistry> = NonNullable<
  ChartConfiguration<TType>["options"]
>;

type PersistedTapTooltip = {
  active: ActiveDataPoint[];
  position: Point;
};
const PERSISTENT_TAP_TOOLTIP_MAX_WIDTH = 1024;

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
  minHeight?: number;
  options?: ChartConfiguration<TType>["options"];
  plugins?: ChartConfiguration<TType>["plugins"];
};

const DataChart = <TType extends keyof ChartTypeRegistry>({
  data,
  minHeight: configuredMinHeight,
  options,
  plugins,
  type,
}: DataChartProps<TType>) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart<TType> | null>(null);
  const latestDataRef = useRef(data);
  const persistedTapTooltipRef = useRef<PersistedTapTooltip | null>(null);
  const theme = useTheme();
  const minHeight =
    configuredMinHeight ?? (type === "doughnut" || type === "pie" ? 224 : 332);

  useEffect(() => {
    latestDataRef.current = data;

    const chart = chartInstanceRef.current;

    if (!chart) return;

    persistedTapTooltipRef.current = null;
    chart.data = data;
    clearPersistentTooltip(chart);
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
    const detachPersistentTapTooltip = attachPersistentTapTooltip(
      chart,
      canvas,
      persistedTapTooltipRef
    );

    chartInstanceRef.current = chart;

    return () => {
      detachPersistentTapTooltip();

      if (chartInstanceRef.current === chart) {
        chartInstanceRef.current = null;
      }

      destroyChart(chart);
    };
  }, [options, plugins, theme.palette.mode, type]);

  return (
    <div
      style={{
        height: configuredMinHeight
          ? `var(--data-chart-height, ${configuredMinHeight}px)`
          : undefined,
        minHeight: `var(--data-chart-min-height, ${minHeight}px)`,
        minWidth: 0,
        position: "relative",
        width: "100%",
      }}
    >
      <canvas aria-hidden="true" ref={chartRef} />
    </div>
  );
};

const attachPersistentTapTooltip = <TType extends keyof ChartTypeRegistry>(
  chart: Chart<TType>,
  canvas: HTMLCanvasElement,
  persistedTapTooltipRef: MutableRefObject<PersistedTapTooltip | null>
): (() => void) => {
  let restoreTimeout: number | undefined;

  const handleTap = (event: Event) => {
    if (!isTapLikeEvent(event)) {
      return;
    }

    const elements = getTapInteractionItems(chart, event);

    if (!elements.length) {
      return;
    }

    const target = buildPersistedTapTooltip(elements);

    if (!target) {
      return;
    }

    persistedTapTooltipRef.current = target;
    applyPersistentTooltip(chart, target);
  };

  const restoreTapTooltip = () => {
    if (!persistedTapTooltipRef.current || !shouldPersistTapTooltips()) {
      return;
    }

    window.clearTimeout(restoreTimeout);
    restoreTimeout = window.setTimeout(() => {
      const target = persistedTapTooltipRef.current;

      if (target) {
        applyPersistentTooltip(chart, target);
      }
    }, 0);
  };

  const clearTapTooltipOnOutsideTap = (event: PointerEvent) => {
    if (!persistedTapTooltipRef.current) {
      return;
    }

    const target = event.target;

    if (target instanceof Node && canvas.contains(target)) {
      return;
    }

    persistedTapTooltipRef.current = null;
    clearPersistentTooltip(chart);
    chart.update("none");
  };

  canvas.addEventListener("pointerup", handleTap);
  canvas.addEventListener("click", handleTap);
  canvas.addEventListener("mouseout", restoreTapTooltip);
  canvas.addEventListener("mouseleave", restoreTapTooltip);
  document.addEventListener("pointerdown", clearTapTooltipOnOutsideTap, true);

  return () => {
    window.clearTimeout(restoreTimeout);
    canvas.removeEventListener("pointerup", handleTap);
    canvas.removeEventListener("click", handleTap);
    canvas.removeEventListener("mouseout", restoreTapTooltip);
    canvas.removeEventListener("mouseleave", restoreTapTooltip);
    document.removeEventListener("pointerdown", clearTapTooltipOnOutsideTap, true);
  };
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

const getTapInteractionItems = <TType extends keyof ChartTypeRegistry>(
  chart: Chart<TType>,
  event: Event
): InteractionItem[] => {
  const interaction = chart.options?.interaction;
  const interactionMode = interaction?.mode ?? "nearest";
  const interactionOptions: InteractionOptions = {
    axis: interaction?.axis,
    includeInvisible: false,
    intersect: interaction?.intersect ?? false,
  };
  const elements = chart.getElementsAtEventForMode(
    event,
    interactionMode as InteractionMode,
    interactionOptions,
    true
  );

  if (elements.length || interactionMode === "nearest") {
    return elements;
  }

  return chart.getElementsAtEventForMode(
    event,
    "nearest",
    {
      ...interactionOptions,
      intersect: false,
    },
    true
  );
};

const buildPersistedTapTooltip = (
  elements: InteractionItem[]
): PersistedTapTooltip | null => {
  const firstElement = elements[0];

  if (!firstElement) {
    return null;
  }

  const tooltipPosition = firstElement.element.tooltipPosition(true);

  return {
    active: elements.map(({ datasetIndex, index }) => ({ datasetIndex, index })),
    position: {
      x: toFiniteNumber(tooltipPosition.x),
      y: toFiniteNumber(tooltipPosition.y),
    },
  };
};

const applyPersistentTooltip = <TType extends keyof ChartTypeRegistry>(
  chart: Chart<TType>,
  target: PersistedTapTooltip
): void => {
  chart.setActiveElements(target.active);
  chart.tooltip?.setActiveElements(target.active, target.position);
  chart.update("none");
};

const clearPersistentTooltip = <TType extends keyof ChartTypeRegistry>(
  chart: Chart<TType>
): void => {
  chart.setActiveElements([]);
  chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
};

const isTapLikeEvent = (event: Event): boolean => {
  if ("pointerType" in event) {
    const pointerType = String(event.pointerType);

    return (
      pointerType === "pen" ||
      pointerType === "touch" ||
      shouldPersistTapTooltips()
    );
  }

  return shouldPersistTapTooltips();
};

const shouldPersistTapTooltips = (): boolean => {
  return (
    isCoarsePointer() || window.innerWidth <= PERSISTENT_TAP_TOOLTIP_MAX_WIDTH
  );
};

const isCoarsePointer = (): boolean => {
  return window.matchMedia("(hover: none), (pointer: coarse)").matches;
};

const toFiniteNumber = (value: unknown): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
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
