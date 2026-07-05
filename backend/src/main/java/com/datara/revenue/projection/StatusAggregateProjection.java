package com.datara.revenue.projection;

import com.datara.revenue.RevenueStatus;

public interface StatusAggregateProjection {

    RevenueStatus getStatus();

    Long getDealCount();
}
