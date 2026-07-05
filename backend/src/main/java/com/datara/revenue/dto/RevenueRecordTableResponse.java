package com.datara.revenue.dto;

import com.datara.revenue.RevenueDimensions;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDate;

public record RevenueRecordTableResponse(
    Long id,

    @JsonProperty("customer_name")
    String customerName,

    BigDecimal amount,
    RevenueStatus status,
    LocalDate date,
    String region,

    @JsonProperty("customer_segment")
    String customerSegment,

    @JsonProperty("account_owner")
    String accountOwner
) {

    public static RevenueRecordTableResponse from(RevenueRecord record) {
        String customerName = record.getCustomerName();

        return new RevenueRecordTableResponse(
            record.getId(),
            customerName,
            record.getAmount(),
            record.getStatus(),
            record.getDate(),
            RevenueDimensions.resolveRegion(customerName),
            RevenueDimensions.resolveCustomerSegment(record.getAmount()),
            RevenueDimensions.resolveAccountOwner(customerName)
        );
    }
}
