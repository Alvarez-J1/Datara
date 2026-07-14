import { apiRequest, type ChartData } from "@/lib/api/client";
import type { DefaultTimeRange } from "@/lib/api/settings";

export type RevenueStatus =
  | "LEAD"
  | "NEGOTIATION"
  | "QUALIFIED"
  | "PROPOSAL"
  | "WON"
  | "LOST";

export type RevenueRecordRow = {
  id: number;
  customer_name: string;
  amount: number;
  status: RevenueStatus;
  date: string;
  region: string;
  customer_segment: string;
  account_owner: string;
};

export type RevenueRecordPage = {
  rows: RevenueRecordRow[];
  rowCount: number;
  page: number;
  size: number;
  totalPages: number;
};

export type RevenueRecordQuery = {
  page?: number;
  size?: number;
  sortBy?: "date" | "amount" | "status";
  sortDirection?: "asc" | "desc";
  search?: string;
  status?: RevenueStatus;
  startDate?: string;
  endDate?: string;
  range?: DefaultTimeRange;
};

export const revenueTrend = (range?: DefaultTimeRange): Promise<ChartData> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<ChartData>(`/api/analytics/revenue-trend${query}`);
};

export const forecastTrend = (range?: DefaultTimeRange): Promise<ChartData> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<ChartData>(`/api/analytics/forecast-trend${query}`);
};

/**
 * Intentionally does not accept a range - there is no "acquisition source"
 * dimension anywhere in the seeded data to honestly filter by date range
 * (unlike region/customer segment, which are derived from real revenue
 * record fields). See backend AnalyticsService.getAcquisitionMix for why.
 */
export const acquisitionMix = (): Promise<ChartData> => {
  return apiRequest<ChartData>("/api/analytics/acquisition-mix");
};

export const customerSegments = (range?: DefaultTimeRange): Promise<ChartData> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<ChartData>(`/api/analytics/customer-segments${query}`);
};

export const regionMix = (range?: DefaultTimeRange): Promise<ChartData> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<ChartData>(`/api/analytics/region-mix${query}`);
};

export const retention = (range?: DefaultTimeRange): Promise<ChartData> => {
  const query = range ? `?range=${range}` : "";
  return apiRequest<ChartData>(`/api/analytics/retention${query}`);
};

export const revenueRecords = (
  query: RevenueRecordQuery = {}
): Promise<RevenueRecordPage> => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  const search = params.toString();
  return apiRequest<RevenueRecordPage>(
    `/api/revenue-records${search ? `?${search}` : ""}`
  );
};
