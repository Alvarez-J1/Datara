package com.datara.common;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    Instant timestamp,
    String code,
    String message,
    String path,
    List<String> details
) {

    public static ErrorResponse of(String code, String message, String path) {
        return new ErrorResponse(Instant.now(), code, message, path, List.of());
    }

    public static ErrorResponse of(
        String code,
        String message,
        String path,
        List<String> details
    ) {
        return new ErrorResponse(Instant.now(), code, message, path, details);
    }
}
