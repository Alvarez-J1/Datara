package com.datara.dashboard.dto;

public record DashboardSummaryResponse(
    KpiMetric netRevenue,
    KpiTrendSeries netRevenueTrend,
    KpiMetric customers,
    KpiTrendSeries customersTrend,
    KpiMetric averageDealSize,
    KpiTrendSeries averageDealSizeTrend,
    KpiMetric winRate,
    KpiTrendSeries winRateTrend
) {
}
