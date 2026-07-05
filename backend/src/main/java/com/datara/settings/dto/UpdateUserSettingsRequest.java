package com.datara.settings.dto;

import com.datara.settings.DefaultTimeRange;
import com.datara.settings.Theme;
import jakarta.validation.constraints.NotNull;

public record UpdateUserSettingsRequest(
    @NotNull(message = "defaultTimeRange is required")
    DefaultTimeRange defaultTimeRange,

    @NotNull(message = "tablePageSize is required")
    Integer tablePageSize,

    boolean compactMode,

    boolean weeklyReport,

    boolean emailDigest,

    boolean anomalyAlerts,

    @NotNull(message = "theme is required")
    Theme theme
) {
}
