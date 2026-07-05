package com.datara.settings.dto;

import com.datara.settings.DefaultTimeRange;
import com.datara.settings.Theme;
import com.datara.settings.UserSettings;

public record UserSettingsResponse(
    DefaultTimeRange defaultTimeRange,
    int tablePageSize,
    boolean compactMode,
    boolean weeklyReport,
    boolean emailDigest,
    boolean anomalyAlerts,
    Theme theme
) {

    public static UserSettingsResponse from(UserSettings settings) {
        return new UserSettingsResponse(
            settings.getDefaultTimeRange(),
            settings.getTablePageSize(),
            settings.isCompactMode(),
            settings.isWeeklyReport(),
            settings.isEmailDigest(),
            settings.isAnomalyAlerts(),
            settings.getTheme()
        );
    }
}
