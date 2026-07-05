package com.datara.dashboard.dto;

import java.math.BigDecimal;

public record ForecastActiveResponse(
    BigDecimal forecastRevenue,
    String formattedForecastRevenue,
    String forecastLabel,
    String forecastDescription
) {
}
