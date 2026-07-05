package com.datara.analytics;

import com.datara.analytics.dto.ChartDataResponse;
import com.datara.analytics.dto.RecentDealResponse;
import com.datara.common.DashboardTimeRange;
import com.datara.security.UserPrincipal;
import java.math.BigDecimal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/revenue-trend")
    public ChartDataResponse<BigDecimal> revenueTrend(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return analyticsService.getRevenueTrend(principal.getId(), DashboardTimeRange.fromParam(range));
    }

    @GetMapping("/sales-by-status")
    public ChartDataResponse<Long> salesByStatus(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return analyticsService.getSalesByStatus(principal.getId());
    }

    @GetMapping("/recent-deals")
    public List<RecentDealResponse> recentDeals(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return analyticsService.getRecentDeals(principal.getId());
    }

    /**
     * Does not accept a range parameter - see {@link AnalyticsService#getAcquisitionMix}
     * for why acquisition source can't be honestly derived per date range.
     */
    @GetMapping("/acquisition-mix")
    public ChartDataResponse<BigDecimal> acquisitionMix(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return analyticsService.getAcquisitionMix(principal.getId());
    }

    @GetMapping("/customer-segments")
    public ChartDataResponse<Number> customerSegments(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return analyticsService.getCustomerSegments(
            principal.getId(),
            DashboardTimeRange.fromParam(range)
        );
    }

    @GetMapping("/product-metrics")
    public ChartDataResponse<Number> productMetrics(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return analyticsService.getProductMetrics(principal.getId());
    }

    @GetMapping("/region-mix")
    public ChartDataResponse<Number> regionMix(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return analyticsService.getRegionMix(principal.getId(), DashboardTimeRange.fromParam(range));
    }

    @GetMapping("/forecast-trend")
    public ChartDataResponse<BigDecimal> forecastTrend(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return analyticsService.getForecastTrend(
            principal.getId(),
            DashboardTimeRange.fromParam(range)
        );
    }

    @GetMapping("/retention")
    public ChartDataResponse<BigDecimal> retention(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(required = false) String range
    ) {
        return analyticsService.getRetention(principal.getId(), DashboardTimeRange.fromParam(range));
    }
}
