package com.datara.dashboard.dto;

import java.math.BigDecimal;

/**
 * A single KPI's current value alongside its month-over-month comparison.
 *
 * {@code deltaPercent} is {@code null} when {@code previousValue} is zero,
 * since a percent change against zero is undefined - callers should treat a
 * null percent alongside {@code deltaDirection} of "NEW" or "NONE" instead of
 * computing Infinity/NaN.
 *
 * deltaDirection is one of: "UP", "DOWN", "FLAT", "NEW" (no prior-period
 * activity to compare against), "NONE" (both periods are zero).
 */
public record KpiMetric(
    BigDecimal currentValue,
    BigDecimal previousValue,
    BigDecimal deltaValue,
    BigDecimal deltaPercent,
    String deltaDirection
) {
}
