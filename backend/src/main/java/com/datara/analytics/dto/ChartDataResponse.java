package com.datara.analytics.dto;

import java.util.List;

public record ChartDataResponse<T extends Number>(
    List<String> labels,
    List<ChartDatasetResponse<T>> datasets
) {
}
