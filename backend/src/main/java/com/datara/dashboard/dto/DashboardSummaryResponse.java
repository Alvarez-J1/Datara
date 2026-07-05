package com.datara.dashboard.dto;

public record DashboardSummaryResponse(
    KpiMetric netRevenue,
    KpiMetric customers,
    KpiMetric averageDealSize,
    KpiMetric winRate
) {
}
