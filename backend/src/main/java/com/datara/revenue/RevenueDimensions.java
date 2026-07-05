package com.datara.revenue;

import java.math.BigDecimal;

/**
 * Deterministic, stable derivations of the "region", "customer segment", and
 * "account owner" dimensions from a {@link RevenueRecord}'s real fields.
 *
 * These aren't stored columns - {@code RevenueRecord} only has customerName,
 * amount, status, and date - so the Revenue Data table (see
 * {@code RevenueRecordTableResponse}) derives them with a stable hash of the
 * customer name (and, for segment, the deal amount) instead. Reusing the
 * exact same derivation here means any chart built from these dimensions
 * (customer segments, region mix) stays internally consistent with what the
 * Data table shows for the same records, instead of drifting out of sync.
 */
public final class RevenueDimensions {

    private static final String[] ACCOUNT_OWNERS = {
        "Sarah Chen",
        "Alex Rivera",
        "Jordan Kim",
        "Maya Patel"
    };

    private RevenueDimensions() {
    }

    public static String resolveRegion(String customerName) {
        int bucket = stableBucket(customerName, 100);

        if (bucket < 58) {
            return "North America";
        }
        if (bucket < 85) {
            return "Europe";
        }
        return "APAC";
    }

    public static String resolveCustomerSegment(BigDecimal amount) {
        BigDecimal safeAmount = amount == null ? BigDecimal.ZERO : amount;

        if (safeAmount.compareTo(new BigDecimal("12000")) >= 0) {
            return "Enterprise";
        }
        if (safeAmount.compareTo(new BigDecimal("4500")) >= 0) {
            return "SMB";
        }
        return "Startup";
    }

    public static String resolveAccountOwner(String customerName) {
        return ACCOUNT_OWNERS[stableBucket(customerName, ACCOUNT_OWNERS.length)];
    }

    private static int stableBucket(String value, int bucketCount) {
        return Math.floorMod(String.valueOf(value).hashCode(), bucketCount);
    }
}
