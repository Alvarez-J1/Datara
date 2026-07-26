import { apiRequest } from "@/lib/api/client";
import type { DefaultTimeRange } from "@/lib/api/settings";

export type KpiDeltaDirection = "UP" | "DOWN" | "FLAT" | "NEW" | "NONE";

export type KpiMetric = {
  currentValue: number;
  previousValue: number;
  deltaValue: number;
  deltaPercent: number | null;
  deltaDirection: KpiDeltaDirection;
};

export type KpiTrendSeries = {
  labels: string[];
  data: number[];
};

export type DashboardSummary = {
  netRevenue: KpiMetric;
  netRevenueTrend: KpiTrendSeries;
  customers: KpiMetric;
  customersTrend: KpiTrendSeries;
  averageDealSize: KpiMetric;
  averageDealSizeTrend: KpiTrendSeries;
  winRate: KpiMetric;
  winRateTrend: KpiTrendSeries;
};

export type ForecastActive = {
  forecastRevenue: number;
  formattedForecastRevenue: string;
  forecastLabel: string;
  forecastDescription: string;
};

export type PipelineMetric = {
  key: string;
  label: string;
  value: string;
  change: string;
  context: string;
};

export type DashboardPanels = {
  forecastActive: ForecastActive;
  pipelineMetrics: PipelineMetric[];
};

export const getDashboardSummary = (
  range?: DefaultTimeRange
): Promise<DashboardSummary> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<DashboardSummary>(`/api/dashboard/summary${query}`);
};

export const getDashboardPanels = (
  range?: DefaultTimeRange
): Promise<DashboardPanels> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<DashboardPanels>(`/api/dashboard/panels${query}`);
};
