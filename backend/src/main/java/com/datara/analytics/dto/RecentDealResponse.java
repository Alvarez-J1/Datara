package com.datara.analytics.dto;

import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record RecentDealResponse(
    Long id,
    String customerName,
    BigDecimal amount,
    RevenueStatus status,
    LocalDate date,
    Instant createdAt
) {

    public static RecentDealResponse from(RevenueRecord record) {
        return new RecentDealResponse(
            record.getId(),
            record.getCustomerName(),
            record.getAmount(),
            record.getStatus(),
            record.getDate(),
            record.getCreatedAt()
        );
    }
}
