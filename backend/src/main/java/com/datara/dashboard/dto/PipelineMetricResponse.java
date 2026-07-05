package com.datara.dashboard.dto;

public record PipelineMetricResponse(
    String key,
    String label,
    String value,
    String change,
    String context
) {
}
