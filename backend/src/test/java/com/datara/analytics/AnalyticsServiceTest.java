package com.datara.analytics;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.datara.analytics.dto.ChartDataResponse;
import com.datara.analytics.dto.RecentDealResponse;
import com.datara.analytics.model.AcquisitionSource;
import com.datara.analytics.model.DashboardForecast;
import com.datara.analytics.model.ProductMetric;
import com.datara.analytics.repository.AcquisitionSourceRepository;
import com.datara.analytics.repository.DashboardForecastRepository;
import com.datara.analytics.repository.ProductMetricRepository;
import com.datara.common.DashboardTimeRange;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueRepository;
import com.datara.revenue.RevenueStatus;
import com.datara.revenue.projection.StatusAggregateProjection;
import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.time.temporal.TemporalAdjusters;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    private static final Long USER_ID = 42L;
    private static final DashboardTimeRange RANGE = DashboardTimeRange.LAST_30_DAYS;

    @Mock
    private RevenueRepository revenueRepository;

    @Mock
    private AcquisitionSourceRepository acquisitionSourceRepository;

    @Mock
    private ProductMetricRepository productMetricRepository;

    @Mock
    private DashboardForecastRepository dashboardForecastRepository;

    @InjectMocks
    private AnalyticsService analyticsService;

    @Test
    void getRevenueTrendGroupsLast30DaysByDayAndFillsMissingDays() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(29);
        LocalDate endDate = today.plusDays(1);
        LocalDate firstRevenueDate = startDate.plusDays(2);
        LocalDate secondRevenueDate = today;

        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, startDate, endDate
        )).thenReturn(List.of(
            wonRecord("Acme Co", "250.00", firstRevenueDate),
            wonRecord("Beta LLC", "475.50", secondRevenueDate)
        ));

        ChartDataResponse<BigDecimal> response =
            analyticsService.getRevenueTrend(USER_ID, RANGE);

        assertThat(response.labels()).hasSize(30);
        assertThat(response.labels().getFirst()).isEqualTo(startDate.toString());
        assertThat(response.labels().getLast()).isEqualTo(today.toString());
        assertThat(response.datasets()).hasSize(1);
        assertThat(response.datasets().getFirst().label()).isEqualTo("Revenue");
        assertThat(response.datasets().getFirst().data()).hasSize(30);
        assertThat(response.datasets().getFirst().data().get(response.labels().indexOf(firstRevenueDate.toString())))
            .isEqualByComparingTo(new BigDecimal("250.00"));
        assertThat(response.datasets().getFirst().data().get(response.labels().indexOf(secondRevenueDate.toString())))
            .isEqualByComparingTo(new BigDecimal("475.50"));
        assertThat(response.datasets().getFirst().data().getFirst()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getRevenueTrendGroupsLast90DaysByWeekAndFillsMissingWeeks() {
        DashboardTimeRange range = DashboardTimeRange.LAST_90_DAYS;
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(89);
        LocalDate endDate = today.plusDays(1);
        LocalDate firstWeek = startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate revenueDate = startDate.plusDays(8);
        LocalDate revenueWeek = revenueDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, startDate, endDate
        )).thenReturn(List.of(
            wonRecord("Acme Co", "900.00", revenueDate)
        ));

        ChartDataResponse<BigDecimal> response =
            analyticsService.getRevenueTrend(USER_ID, range);

        assertThat(response.labels().size()).isGreaterThan(10);
        assertThat(response.labels().getFirst()).isEqualTo(firstWeek.toString());
        assertThat(response.labels()).contains(revenueWeek.toString());
        assertThat(response.datasets().getFirst().data().get(response.labels().indexOf(revenueWeek.toString())))
            .isEqualByComparingTo(new BigDecimal("900.00"));
        assertThat(response.datasets().getFirst().data().getFirst()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getRevenueTrendGroupsLast12MonthsByMonthAndFillsMissingMonths() {
        DashboardTimeRange range = DashboardTimeRange.LAST_12_MONTHS;
        LocalDate today = LocalDate.now();
        YearMonth firstMonth = YearMonth.from(today).minusMonths(11);
        YearMonth currentMonth = YearMonth.from(today);
        LocalDate startDate = firstMonth.atDay(1);
        LocalDate endDate = today.plusDays(1);

        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, startDate, endDate
        )).thenReturn(List.of(
            wonRecord("Acme Co", "1200.00", firstMonth.atDay(2)),
            wonRecord("Beta LLC", "2200.00", currentMonth.atDay(1))
        ));

        ChartDataResponse<BigDecimal> response =
            analyticsService.getRevenueTrend(USER_ID, range);

        assertThat(response.labels()).hasSize(12);
        assertThat(response.labels().getFirst()).isEqualTo(firstMonth.toString());
        assertThat(response.labels().getLast()).isEqualTo(currentMonth.toString());
        assertThat(response.datasets().getFirst().data().getFirst())
            .isEqualByComparingTo(new BigDecimal("1200.00"));
        assertThat(response.datasets().getFirst().data().getLast())
            .isEqualByComparingTo(new BigDecimal("2200.00"));
    }

    @Test
    void getSalesByStatusReturnsEveryStatusWithZeroesForMissingStatuses() {
        Long userId = 42L;
        when(revenueRepository.countDealsByStatusForUser(userId))
            .thenReturn(List.of(
                statusCount(RevenueStatus.LEAD, 2L),
                statusCount(RevenueStatus.WON, 4L)
            ));

        ChartDataResponse<Long> response = analyticsService.getSalesByStatus(userId);

        assertThat(response.labels()).containsExactly("LEAD", "NEGOTIATION", "WON", "LOST");
        assertThat(response.datasets()).hasSize(1);
        assertThat(response.datasets().getFirst().label()).isEqualTo("Deals");
        assertThat(response.datasets().getFirst().data()).containsExactly(2L, 0L, 4L, 0L);
    }

    @Test
    void getRecentDealsReturnsLastTenRecordsAsDtos() {
        Long userId = 42L;
        RevenueRecord record = RevenueRecord.builder()
            .id(10L)
            .customerName("Acme Co")
            .amount(new BigDecimal("900.00"))
            .status(RevenueStatus.NEGOTIATION)
            .date(LocalDate.of(2026, 7, 1))
            .createdAt(Instant.parse("2026-07-01T12:00:00Z"))
            .build();

        when(revenueRepository.findRecentDealsByUserId(eq(userId), eq(PageRequest.of(0, 10))))
            .thenReturn(List.of(record));

        List<RecentDealResponse> response = analyticsService.getRecentDeals(userId);

        assertThat(response).hasSize(1);
        assertThat(response.getFirst().id()).isEqualTo(10L);
        assertThat(response.getFirst().customerName()).isEqualTo("Acme Co");
        assertThat(response.getFirst().amount()).isEqualByComparingTo("900.00");
        assertThat(response.getFirst().status()).isEqualTo(RevenueStatus.NEGOTIATION);
        assertThat(response.getFirst().date()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(response.getFirst().createdAt())
            .isEqualTo(Instant.parse("2026-07-01T12:00:00Z"));
        verify(revenueRepository).findRecentDealsByUserId(userId, PageRequest.of(0, 10));
    }

    @Test
    void getAcquisitionMixReturnsSourceRevenueChartData() {
        Long userId = 42L;
        when(acquisitionSourceRepository.findByUserId(userId))
            .thenReturn(List.of(
                AcquisitionSource.builder()
                    .sourceName("Organic")
                    .revenue(new BigDecimal("1200.00"))
                    .build(),
                AcquisitionSource.builder()
                    .sourceName("Paid Ads")
                    .revenue(null)
                    .build()
            ));

        ChartDataResponse<BigDecimal> response = analyticsService.getAcquisitionMix(userId);

        assertThat(response.labels()).containsExactly("Organic", "Paid Ads");
        assertThat(response.datasets()).hasSize(1);
        assertThat(response.datasets().getFirst().label()).isEqualTo("Revenue");
        assertThat(response.datasets().getFirst().data())
            .containsExactly(new BigDecimal("1200.00"), BigDecimal.ZERO);
    }

    @Test
    void getCustomerSegmentsAggregatesWonRecordsInRangeByDerivedSegment() {
        LocalDate today = LocalDate.now();
        LocalDate startDate = RANGE.startDate(today);
        LocalDate endDate = RANGE.endDateExclusive(today);

        // Amounts drive RevenueDimensions.resolveCustomerSegment: >=12000 Enterprise,
        // >=4500 SMB, else Startup.
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, startDate, endDate
        )).thenReturn(List.of(
            wonRecord("Acme Co", "15000.00", LocalDate.of(2026, 6, 1)),
            wonRecord("Acme Co", "16000.00", LocalDate.of(2026, 6, 10)),
            wonRecord("Beta LLC", "6000.00", LocalDate.of(2026, 6, 5)),
            wonRecord("Gamma Inc", "1000.00", LocalDate.of(2026, 6, 12))
        ));

        ChartDataResponse<Number> response =
            analyticsService.getCustomerSegments(USER_ID, RANGE);

        assertThat(response.labels()).containsExactly("Enterprise", "SMB", "Startup");
        assertThat(response.datasets()).hasSize(2);

        assertThat(response.datasets().get(0).label()).isEqualTo("Customers");
        assertThat(response.datasets().get(0).data()).containsExactly(1L, 1L, 1L);

        assertThat(response.datasets().get(1).label()).isEqualTo("Revenue");
        assertThat(response.datasets().get(1).data())
            .containsExactly(
                new BigDecimal("31000.00"),
                new BigDecimal("6000.00"),
                new BigDecimal("1000.00")
            );
    }

    @Test
    void getCustomerSegmentsReturnsZeroesWhenNoRecordsInRange() {
        LocalDate today = LocalDate.now();
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            eq(USER_ID), eq(RevenueStatus.WON), eq(RANGE.startDate(today)), eq(RANGE.endDateExclusive(today))
        )).thenReturn(List.of());

        ChartDataResponse<Number> response =
            analyticsService.getCustomerSegments(USER_ID, RANGE);

        assertThat(response.datasets().get(0).data()).containsExactly(0L, 0L, 0L);
        assertThat(response.datasets().get(1).data())
            .containsExactly(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);
    }

    @Test
    void getProductMetricsReturnsRevenueAndUnitsSoldChartData() {
        Long userId = 42L;
        when(productMetricRepository.findByUserId(userId))
            .thenReturn(List.of(
                ProductMetric.builder()
                    .productName("Business Plan")
                    .revenue(new BigDecimal("3200.00"))
                    .unitsSold(16L)
                    .build()
            ));

        ChartDataResponse<Number> response = analyticsService.getProductMetrics(userId);

        assertThat(response.labels()).containsExactly("Business Plan");
        assertThat(response.datasets()).hasSize(2);
        assertThat(response.datasets().get(0).label()).isEqualTo("Revenue");
        assertThat(response.datasets().get(0).data()).containsExactly(new BigDecimal("3200.00"));
        assertThat(response.datasets().get(1).label()).isEqualTo("Units Sold");
        assertThat(response.datasets().get(1).data()).containsExactly(16L);
    }

    @Test
    void getRegionMixComputesRevenueAndRealGrowthRateAgainstPriorPeriod() {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = RANGE.startDate(today);
        LocalDate currentEnd = RANGE.endDateExclusive(today);
        LocalDate previousStart = RANGE.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        // "Beta LLC" hashes into the North America bucket (see RevenueDimensions).
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, currentStart, currentEnd
        )).thenReturn(List.of(
            wonRecord("Beta LLC", "10000.00", currentStart.plusDays(1))
        ));
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, previousStart, previousEnd
        )).thenReturn(List.of(
            wonRecord("Beta LLC", "8000.00", previousStart.plusDays(1))
        ));

        ChartDataResponse<Number> response = analyticsService.getRegionMix(USER_ID, RANGE);

        assertThat(response.labels()).containsExactly("North America", "Europe", "APAC");
        assertThat(response.datasets()).hasSize(2);
        assertThat(response.datasets().get(0).label()).isEqualTo("Revenue");
        assertThat(response.datasets().get(0).data())
            .containsExactly(new BigDecimal("10000.00"), BigDecimal.ZERO, BigDecimal.ZERO);

        // (10000 - 8000) / 8000 * 100 = 25.00% growth for North America.
        assertThat(response.datasets().get(1).label()).isEqualTo("Growth Rate");
        assertThat((BigDecimal) response.datasets().get(1).data().get(0))
            .isEqualByComparingTo(new BigDecimal("25.00"));
        assertThat((BigDecimal) response.datasets().get(1).data().get(1)).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat((BigDecimal) response.datasets().get(1).data().get(2)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getForecastTrendReturnsPredictedAndActualRevenueByMonth() {
        Long userId = 42L;
        YearMonth previousMonth = YearMonth.from(LocalDate.now()).minusMonths(1);
        YearMonth currentMonth = YearMonth.from(LocalDate.now());

        when(dashboardForecastRepository.findByUserId(userId))
            .thenReturn(List.of(
                DashboardForecast.builder()
                    .month(previousMonth.atDay(1))
                    .predictedRevenue(new BigDecimal("1000.00"))
                    .actualRevenue(new BigDecimal("950.00"))
                    .build(),
                DashboardForecast.builder()
                    .month(currentMonth.atDay(1))
                    .predictedRevenue(new BigDecimal("1100.00"))
                    .actualRevenue(null)
                    .build()
            ));

        ChartDataResponse<BigDecimal> response =
            analyticsService.getForecastTrend(userId, DashboardTimeRange.LAST_12_MONTHS);

        assertThat(response.labels()).hasSize(12);
        assertThat(response.labels()).contains(previousMonth.toString(), currentMonth.toString());
        assertThat(response.datasets()).hasSize(2);
        assertThat(response.datasets().get(0).label()).isEqualTo("Predicted Revenue");
        assertThat(response.datasets().get(1).label()).isEqualTo("Actual Revenue");
        assertThat(response.datasets().get(0).data().get(response.labels().indexOf(previousMonth.toString())))
            .isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(response.datasets().get(0).data().get(response.labels().indexOf(currentMonth.toString())))
            .isEqualByComparingTo(new BigDecimal("1100.00"));
        assertThat(response.datasets().get(1).data().get(response.labels().indexOf(previousMonth.toString())))
            .isEqualByComparingTo(new BigDecimal("950.00"));
        assertThat(response.datasets().get(1).data().get(response.labels().indexOf(currentMonth.toString())))
            .isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getRetentionComputesRealMonthOverMonthCohortRetention() {
        LocalDate today = LocalDate.now();
        LocalDate rangeStart = RANGE.startDate(today);
        LocalDate rangeEnd = RANGE.endDateExclusive(today);

        YearMonth firstMonth = YearMonth.from(rangeStart);
        YearMonth priorMonth = firstMonth.minusMonths(1);
        LocalDate fetchStart = firstMonth.minusMonths(1).atDay(1);

        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, fetchStart, rangeEnd
        )).thenReturn(List.of(
            wonRecord("Acme Co", "5000.00", priorMonth.atDay(2)),
            wonRecord("Beta LLC", "5000.00", priorMonth.atDay(3)),
            wonRecord("Acme Co", "5000.00", firstMonth.atDay(2))
        ));

        ChartDataResponse<BigDecimal> response = analyticsService.getRetention(USER_ID, RANGE);

        assertThat(response.labels()).contains(firstMonth.toString());
        int firstMonthIndex = response.labels().indexOf(firstMonth.toString());

        // Acme Co retained (present in both months), Beta LLC churned -> 1 retained, 1 churned -> 50%.
        assertThat(response.datasets()).hasSize(1);
        assertThat(response.datasets().getFirst().label()).isEqualTo("Retention Rate");
        assertThat(response.datasets().getFirst().data().get(firstMonthIndex))
            .isEqualByComparingTo(new BigDecimal("50.00"));
    }

    private RevenueRecord wonRecord(String customerName, String amount, LocalDate date) {
        return RevenueRecord.builder()
            .customerName(customerName)
            .amount(new BigDecimal(amount))
            .status(RevenueStatus.WON)
            .date(date)
            .build();
    }

    private StatusAggregateProjection statusCount(RevenueStatus status, Long dealCount) {
        return new StatusAggregateProjection() {
            @Override
            public RevenueStatus getStatus() {
                return status;
            }

            @Override
            public Long getDealCount() {
                return dealCount;
            }
        };
    }
}
