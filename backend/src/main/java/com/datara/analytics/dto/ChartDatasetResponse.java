package com.datara.analytics.dto;

import java.util.List;

public record ChartDatasetResponse<T extends Number>(
    String label,
    List<T> data
) {
}
