package com.datara.revenue.projection;

import java.math.BigDecimal;

public interface MonthlyRevenueProjection {

    Integer getYear();

    Integer getMonth();

    BigDecimal getRevenue();
}
