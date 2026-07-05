"use client";

import { Grid, Paper, Typography } from "@mui/material";
import type { ChartConfiguration } from "chart.js";
import DataChart from "@/components/DataChart/DataChart";
import {
  acquisitionMix,
  customerSegments,
  retention,
  regionMix,
} from "@/lib/api/analytics";
import {
  normalizeChartData,
  reportSettledApiError,
  type ChartData as ApiChartData,
} from "@/lib/api/client";
import type { DefaultTimeRange } from "@/lib/api/settings";
import { useEffect, useMemo, useState } from "react";
import scss from "./TransactionsBottomRow.module.scss";

type DoughnutChartData = ChartConfiguration<"doughnut">["data"];

type BottomRowChartData = {
  acquisition: DoughnutChartData;
  customerSegments: DoughnutChartData;
  retention: DoughnutChartData;
  region: DoughnutChartData;
};

const doughnutOptions: ChartConfiguration<"doughnut">["options"] = {
  cutout: "68%",
  plugins: {
    legend: {
      position: "bottom",
    },
  },
};

const styledAcquisitionChart: DoughnutChartData = {
  labels: [],
  datasets: [
    {
      label: "Pipeline source",
      data: [],
      backgroundColor: ["#14b8a6", "#2563eb", "#f59e0b", "#f43f5e"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

const styledRetentionChart: DoughnutChartData = {
  labels: [],
  datasets: [
    {
      label: "Account health",
      data: [],
      backgroundColor: ["#22c55e", "#2dd4bf", "#f97316"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

const styledCustomerSegmentsChart: DoughnutChartData = {
  labels: [],
  datasets: [
    {
      label: "Revenue tier",
      data: [],
      backgroundColor: ["#475569", "#94a3b8", "#cbd5e1"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

const styledRegionChart: DoughnutChartData = {
  labels: [],
  datasets: [
    {
      label: "Regional revenue",
      data: [],
      backgroundColor: ["#14b8a6", "#8b5cf6", "#06b6d4", "#f59e0b"],
      borderWidth: 0,
      hoverOffset: 8,
    },
  ],
};

const fallbackChartData: BottomRowChartData = {
  acquisition: styledAcquisitionChart,
  customerSegments: styledCustomerSegmentsChart,
  retention: styledRetentionChart,
  region: styledRegionChart,
};

const analyticsCards = [
  {
    data: styledAcquisitionChart,
    detail: "Organic and partner-sourced accounts continue to carry the highest win rate.",
    highlight: "42%",
    label: "Organic pipeline",
    title: "Acquisition Mix",
  },
  {
    data: styledRetentionChart,
    detail: "Renewals remain healthy despite a small number of at-risk accounts.",
    highlight: "89%",
    label: "Healthy accounts",
    title: "Retention Health",
  },
  {
    data: styledCustomerSegmentsChart,
    detail: "Enterprise customers now make up the largest share of revenue.",
    highlight: "48%",
    label: "Enterprise share",
    title: "Customer Tiers",
  },
  {
    data: styledRegionChart,
    detail: "North America remains the largest market, while Europe continues to grow.",
    highlight: "58%",
    label: "NA revenue",
    title: "Regional Mix",
  },
];

type TransactionsBottomRowProps = {
  compactMode?: boolean;
  range?: DefaultTimeRange;
};

const TransactionsBottomRow = ({
  compactMode = false,
  range,
}: TransactionsBottomRowProps) => {
  const [chartData, setChartData] = useState(fallbackChartData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadChartData = async () => {
      setIsLoading(true);

      // Acquisition mix intentionally never receives a range - there's no
      // "acquisition source" dimension on revenue records to filter by date,
      // so it stays a static snapshot (see backend AnalyticsService).
      const [
        acquisitionResponse,
        customerSegmentsResponse,
        retentionResponse,
        regionResponse,
      ] =
        await Promise.allSettled([
          acquisitionMix(),
          customerSegments(range),
          retention(range),
          regionMix(range),
        ]);

      if (!isMounted) {
        return;
      }

      reportSettledApiError(acquisitionResponse, "Acquisition mix");
      reportSettledApiError(customerSegmentsResponse, "Customer segments");
      reportSettledApiError(retentionResponse, "Retention");
      reportSettledApiError(regionResponse, "Region mix");

      setChartData((currentData) => ({
        acquisition:
          acquisitionResponse.status === "fulfilled"
            ? mergeDoughnutData(styledAcquisitionChart, acquisitionResponse.value)
            : currentData.acquisition,
        customerSegments:
          customerSegmentsResponse.status === "fulfilled"
            ? mergeDoughnutData(
                styledCustomerSegmentsChart,
                customerSegmentsResponse.value,
                "Revenue"
              )
            : currentData.customerSegments,
        retention:
          retentionResponse.status === "fulfilled"
            ? mergeDoughnutData(styledRetentionChart, retentionResponse.value)
            : currentData.retention,
        region:
          regionResponse.status === "fulfilled"
            ? mergeDoughnutData(styledRegionChart, regionResponse.value)
            : currentData.region,
      }));
      setIsLoading(false);
    };

    loadChartData();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const cards = useMemo(
    () =>
      analyticsCards.map((card) => {
        switch (card.title) {
          case "Acquisition Mix":
            return { ...card, data: chartData.acquisition };
          case "Customer Tiers":
            return { ...card, data: chartData.customerSegments };
          case "Retention Health":
            return { ...card, data: chartData.retention };
          case "Regional Mix":
            return { ...card, data: chartData.region };
          default:
            return card;
        }
      }),
    [chartData]
  );

  return (
    <Grid
      className={`${scss.bottomRow} ${compactMode ? scss.compact : ""}`}
      container
      spacing={compactMode ? 2 : 2.5}
      sx={{ maxWidth: "100%", width: "100%" }}
    >
      {cards.map((card) => (
        <Grid key={card.title} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper
            aria-busy={isLoading}
            className={`${scss.analyticsCard} ${compactMode ? scss.compact : ""}`}
          >
            <div className={scss.cardHeader}>
              <div>
                <Typography className={scss.cardTitle} component="h3">
                  {card.title}
                </Typography>
                <Typography className={scss.cardDetail}>{card.detail}</Typography>
              </div>
            </div>

            <DataChart data={card.data} options={doughnutOptions} type="doughnut" />

            <div className={scss.cardFooter}>
              <Typography className={scss.highlight}>{card.highlight}</Typography>
              <Typography className={scss.footerLabel}>{card.label}</Typography>
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

const mergeDoughnutData = (
  fallbackData: DoughnutChartData,
  response: ApiChartData,
  preferredDatasetLabel?: string
): DoughnutChartData => {
  const normalizedResponse = normalizeChartData(response);

  if (!isChartResponseUsable(normalizedResponse)) {
    return fallbackData;
  }

  const responseDataset =
    normalizedResponse.datasets.find(
      (dataset) =>
        preferredDatasetLabel &&
        dataset.label.toLowerCase() === preferredDatasetLabel.toLowerCase()
    ) ?? normalizedResponse.datasets[0];

  return {
    ...fallbackData,
    labels: normalizedResponse.labels,
    datasets: fallbackData.datasets.map((dataset, index) =>
      index === 0
        ? {
            ...dataset,
            data: responseDataset.data,
            label: responseDataset.label || dataset.label,
          }
        : dataset
    ),
  };
};

const isChartResponseUsable = (
  response: ApiChartData | undefined
): response is ApiChartData => {
  return Boolean(
    response?.labels.length &&
      response.datasets.some((dataset) => dataset.data.length > 0)
  );
};

export default TransactionsBottomRow;
