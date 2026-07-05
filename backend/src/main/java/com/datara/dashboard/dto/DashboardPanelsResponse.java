package com.datara.dashboard.dto;

import java.util.List;

public record DashboardPanelsResponse(
    ForecastActiveResponse forecastActive,
    List<PipelineMetricResponse> pipelineMetrics
) {
}
