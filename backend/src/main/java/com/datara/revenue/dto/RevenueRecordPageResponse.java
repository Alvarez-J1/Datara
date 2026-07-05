package com.datara.revenue.dto;

import java.util.List;

public record RevenueRecordPageResponse(
    List<RevenueRecordTableResponse> rows,
    long rowCount,
    int page,
    int size,
    int totalPages
) {
}
