package com.datara.common;

import java.time.LocalDate;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/**
 * The dashboard-wide time range filter. Mirrors the {@code defaultTimeRange}
 * values persisted in user settings (LAST_30_DAYS / LAST_90_DAYS /
 * LAST_12_MONTHS) so it's shared by the dashboard summary, analytics, and
 * revenue record endpoints - "Last 30 Days" means the same window everywhere.
 */
public enum DashboardTimeRange {
    LAST_30_DAYS,
    LAST_90_DAYS,
    LAST_12_MONTHS;

    /** Defaults to LAST_12_MONTHS (matching the Settings default) when absent. */
    public static DashboardTimeRange fromParam(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return LAST_12_MONTHS;
        }

        try {
            return DashboardTimeRange.valueOf(rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Unsupported range: " + rawValue
            );
        }
    }

    /** Inclusive start of the "current" window, counting back from today. */
    public LocalDate startDate(LocalDate today) {
        return switch (this) {
            case LAST_30_DAYS -> today.minusDays(30);
            case LAST_90_DAYS -> today.minusDays(90);
            case LAST_12_MONTHS -> today.minusMonths(12);
        };
    }

    /** Exclusive end of the "current" window - the day after today, so today is included. */
    public LocalDate endDateExclusive(LocalDate today) {
        return today.plusDays(1);
    }

    /** Inclusive start of the equal-length window immediately preceding the current one. */
    public LocalDate previousStartDate(LocalDate today) {
        LocalDate currentStart = startDate(today);

        return switch (this) {
            case LAST_30_DAYS -> currentStart.minusDays(30);
            case LAST_90_DAYS -> currentStart.minusDays(90);
            case LAST_12_MONTHS -> currentStart.minusMonths(12);
        };
    }
}
