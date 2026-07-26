package com.datara.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

public record KpiTrendSeries(
    List<String> labels,
    List<BigDecimal> data
) {
}
