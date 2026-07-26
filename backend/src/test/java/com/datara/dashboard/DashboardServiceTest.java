package com.datara.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.datara.analytics.model.DashboardForecast;
import com.datara.analytics.repository.DashboardForecastRepository;
import com.datara.common.DashboardTimeRange;
import com.datara.dashboard.dto.DashboardPanelsResponse;
import com.datara.dashboard.dto.DashboardSummaryResponse;
import com.datara.dashboard.dto.KpiMetric;
import com.datara.dashboard.dto.PipelineMetricResponse;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueRepository;
import com.datara.revenue.RevenueStatus;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final Long USER_ID = 42L;
    private static final DashboardTimeRange RANGE = DashboardTimeRange.LAST_30_DAYS;

    @Mock
    private RevenueRepository revenueRepository;

    @Mock
    private DashboardForecastRepository dashboardForecastRepository;

    @InjectMocks
    private DashboardService dashboardService;

    @Test
    void getSummaryCalculatesRangeOverRangeDeltasFromRevenueAggregates() {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = RANGE.startDate(today);
        LocalDate currentEnd = RANGE.endDateExclusive(today);
        LocalDate previousStart = RANGE.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, currentStart, currentEnd
        )).thenReturn(List.of(
            revenueRecord(1L, "Alpha", "400.00", RevenueStatus.WON, currentStart),
            revenueRecord(2L, "Beta", "400.00", RevenueStatus.WON, currentStart.plusDays(1)),
            revenueRecord(3L, "Gamma", "400.00", RevenueStatus.WON, currentStart.plusDays(2)),
            revenueRecord(4L, "Delta", "400.00", RevenueStatus.WON, currentStart.plusDays(3)),
            revenueRecord(5L, "Epsilon", "250.00", RevenueStatus.LOST, currentStart.plusDays(4))
        ));
        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, previousStart, previousEnd
        )).thenReturn(List.of(
            revenueRecord(6L, "Prior Alpha", "400.00", RevenueStatus.WON, previousStart),
            revenueRecord(7L, "Prior Beta", "400.00", RevenueStatus.WON, previousStart.plusDays(1)),
            revenueRecord(8L, "Prior Gamma", "400.00", RevenueStatus.WON, previousStart.plusDays(2)),
            revenueRecord(9L, "Prior Delta", "250.00", RevenueStatus.LOST, previousStart.plusDays(3))
        ));

        DashboardSummaryResponse response = dashboardService.getSummary(USER_ID, RANGE);

        KpiMetric netRevenue = response.netRevenue();
        assertThat(netRevenue.currentValue()).isEqualByComparingTo("1600.00");
        assertThat(netRevenue.previousValue()).isEqualByComparingTo("1200.00");
        assertThat(netRevenue.deltaValue()).isEqualByComparingTo("400.00");
        assertThat(netRevenue.deltaPercent()).isEqualByComparingTo("33.33");
        assertThat(netRevenue.deltaDirection()).isEqualTo("UP");
        assertThat(response.netRevenueTrend().labels()).isNotEmpty();
        assertThat(response.netRevenueTrend().labels().get(0)).doesNotContain("-");
        BigDecimal netRevenueTrendTotal = response.netRevenueTrend().data().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(netRevenueTrendTotal).isEqualByComparingTo(response.netRevenue().currentValue());

        KpiMetric customers = response.customers();
        assertThat(customers.currentValue()).isEqualByComparingTo("5");
        assertThat(customers.previousValue()).isEqualByComparingTo("4");
        assertThat(customers.deltaValue()).isEqualByComparingTo("1");
        assertThat(customers.deltaPercent()).isEqualByComparingTo("25.00");
        assertThat(customers.deltaDirection()).isEqualTo("UP");
        assertThat(response.customersTrend().data().get(response.customersTrend().data().size() - 1))
            .isEqualByComparingTo(response.customers().currentValue());

        // Avg deal size: 1600/4 = 400.00 current vs 1200/3 = 400.00 previous -> flat.
        KpiMetric averageDealSize = response.averageDealSize();
        assertThat(averageDealSize.currentValue()).isEqualByComparingTo("400.00");
        assertThat(averageDealSize.previousValue()).isEqualByComparingTo("400.00");
        assertThat(averageDealSize.deltaValue()).isEqualByComparingTo("0.00");
        assertThat(averageDealSize.deltaPercent()).isEqualByComparingTo("0.00");
        assertThat(averageDealSize.deltaDirection()).isEqualTo("FLAT");

        // Win rate: current 4/5 = 80.00 vs previous 3/4 = 75.00.
        KpiMetric winRate = response.winRate();
        assertThat(winRate.currentValue()).isEqualByComparingTo("80.00");
        assertThat(winRate.previousValue()).isEqualByComparingTo("75.00");
        assertThat(winRate.deltaValue()).isEqualByComparingTo("5.00");
        assertThat(winRate.deltaDirection()).isEqualTo("UP");
        assertThat(response.winRateTrend().data()).contains(BigDecimal.valueOf(100).setScale(2));
    }

    @Test
    void getSummaryReturnsNewDirectionWhenPreviousPeriodHasNoActivity() {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = RANGE.startDate(today);
        LocalDate currentEnd = RANGE.endDateExclusive(today);
        LocalDate previousStart = RANGE.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, currentStart, currentEnd
        )).thenReturn(List.of(
            revenueRecord(1L, "New Alpha", "250.00", RevenueStatus.WON, currentStart),
            revenueRecord(2L, "New Beta", "250.00", RevenueStatus.WON, currentStart.plusDays(1))
        ));
        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, previousStart, previousEnd
        )).thenReturn(List.of());

        DashboardSummaryResponse response = dashboardService.getSummary(USER_ID, RANGE);

        assertThat(response.netRevenue().deltaDirection()).isEqualTo("NEW");
        assertThat(response.netRevenue().deltaPercent()).isNull();
        assertThat(response.customers().deltaDirection()).isEqualTo("NEW");
        assertThat(response.customers().deltaPercent()).isNull();
        assertThat(response.averageDealSize().deltaDirection()).isEqualTo("NEW");
        assertThat(response.averageDealSize().deltaPercent()).isNull();
        // Current window: 2 won, 0 lost -> 100% win rate; previous window had no
        // closed deals at all (0/0), so previous is 0 and direction is "NEW".
        assertThat(response.winRate().deltaDirection()).isEqualTo("NEW");
        assertThat(response.winRate().deltaPercent()).isNull();
    }

    @Test
    void getSummaryReturnsNoneDirectionWhenBothPeriodsAreEmpty() {
        when(revenueRepository.findByUserIdBetweenDates(
            eq(USER_ID), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(List.of());

        DashboardSummaryResponse response = dashboardService.getSummary(USER_ID, RANGE);

        assertThat(response.netRevenue().deltaDirection()).isEqualTo("NONE");
        assertThat(response.netRevenue().deltaPercent()).isNull();
        assertThat(response.customers().deltaDirection()).isEqualTo("NONE");
        assertThat(response.customers().deltaPercent()).isNull();
        assertThat(response.averageDealSize().deltaDirection()).isEqualTo("NONE");
        assertThat(response.averageDealSize().deltaPercent()).isNull();
        assertThat(response.winRate().deltaDirection()).isEqualTo("NONE");
        assertThat(response.winRate().deltaPercent()).isNull();
    }

    @Test
    void getSummaryFormatsTrendLabelsForSelectedGranularity() {
        when(revenueRepository.findByUserIdBetweenDates(
            eq(USER_ID), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(List.of());

        DashboardSummaryResponse daily =
            dashboardService.getSummary(USER_ID, DashboardTimeRange.LAST_30_DAYS);
        DashboardSummaryResponse weekly =
            dashboardService.getSummary(USER_ID, DashboardTimeRange.LAST_90_DAYS);
        DashboardSummaryResponse monthly =
            dashboardService.getSummary(USER_ID, DashboardTimeRange.LAST_12_MONTHS);

        assertThat(daily.netRevenueTrend().labels().get(0)).doesNotContain("-");
        assertThat(weekly.netRevenueTrend().labels().get(0)).startsWith("Week of ");
        assertThat(monthly.netRevenueTrend().labels().get(0)).contains(" ");
    }

    @Test
    void getPanelsCalculatesRangeAwareForecastAndPipelineMetrics() {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = RANGE.startDate(today);
        LocalDate currentEnd = RANGE.endDateExclusive(today);
        LocalDate previousStart = RANGE.previousStartDate(today);
        LocalDate previousEnd = currentStart;
        List<RevenueStatus> activeStatuses = List.of(
            RevenueStatus.LEAD,
            RevenueStatus.NEGOTIATION
        );

        when(dashboardForecastRepository.findByUserId(USER_ID)).thenReturn(List.of(
            DashboardForecast.builder()
                .month(YearMonth.from(currentStart).atDay(1))
                .predictedRevenue(new BigDecimal("31000.00"))
                .build(),
            DashboardForecast.builder()
                .month(YearMonth.from(currentEnd.minusDays(1)).atDay(1))
                .predictedRevenue(new BigDecimal("62000.00"))
                .build()
        ));
        when(revenueRepository.sumAmountByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.LEAD, currentStart, currentEnd
        )).thenReturn(new BigDecimal("1000.00"));
        when(revenueRepository.sumAmountByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.NEGOTIATION, currentStart, currentEnd
        )).thenReturn(new BigDecimal("3000.00"));

        when(revenueRepository.sumAmountByUserIdAndStatusesBetweenDates(
            USER_ID, activeStatuses, currentStart, currentEnd
        )).thenReturn(new BigDecimal("4000.00"));
        when(revenueRepository.sumAmountByUserIdAndStatusesBetweenDates(
            USER_ID, activeStatuses, previousStart, previousEnd
        )).thenReturn(new BigDecimal("2000.00"));
        when(revenueRepository.countByUserIdAndStatusesBetweenDates(
            USER_ID, activeStatuses, currentStart, currentEnd
        )).thenReturn(5L);

        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, currentStart, currentEnd
        )).thenReturn(List.of(
            revenueRecord(1L, "Lead Co", "100.00", RevenueStatus.LEAD, currentStart),
            revenueRecord(2L, "Negotiating Co", "100.00", RevenueStatus.NEGOTIATION, currentStart),
            revenueRecord(3L, "Won Co", "100.00", RevenueStatus.WON, currentStart),
            revenueRecord(4L, "Lost Co", "100.00", RevenueStatus.LOST, currentStart)
        ));
        when(revenueRepository.findByUserIdBetweenDates(
            USER_ID, previousStart, previousEnd
        )).thenReturn(List.of(
            revenueRecord(5L, "Prior Won A", "100.00", RevenueStatus.WON, previousStart),
            revenueRecord(6L, "Prior Won B", "100.00", RevenueStatus.WON, previousStart)
        ));

        when(revenueRepository.findCustomerNamesByUserIdAndStatusBeforeDate(
            USER_ID, RevenueStatus.WON, currentStart
        )).thenReturn(List.of("Existing Co"));
        when(revenueRepository.findCustomerNamesByUserIdAndStatusBeforeDate(
            USER_ID, RevenueStatus.WON, previousStart
        )).thenReturn(List.of());
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, currentStart, currentEnd
        )).thenReturn(List.of(
            revenueRecord(7L, "Existing Co", "1000.00", RevenueStatus.WON, currentStart),
            revenueRecord(8L, "New Co", "2000.00", RevenueStatus.WON, currentStart.plusDays(1)),
            revenueRecord(9L, "New Co", "3000.00", RevenueStatus.WON, currentStart.plusDays(2))
        ));
        when(revenueRepository.findByUserIdAndStatusBetweenDates(
            USER_ID, RevenueStatus.WON, previousStart, previousEnd
        )).thenReturn(List.of(
            revenueRecord(10L, "Old Co", "1000.00", RevenueStatus.WON, previousStart),
            revenueRecord(11L, "Old Co", "2000.00", RevenueStatus.WON, previousStart.plusDays(1))
        ));

        DashboardPanelsResponse response = dashboardService.getPanels(USER_ID, RANGE);

        assertThat(response.forecastActive().forecastLabel()).isEqualTo("Last 30 Days");
        assertThat(response.forecastActive().forecastDescription())
            .isEqualTo("30-day forecast based on active pipeline");
        assertThat(response.forecastActive().forecastRevenue())
            .isGreaterThan(BigDecimal.ZERO);
        assertThat(response.forecastActive().formattedForecastRevenue())
            .startsWith("$");

        assertThat(response.pipelineMetrics()).hasSize(3);

        PipelineMetricResponse qualifiedPipeline = response.pipelineMetrics().get(0);
        assertThat(qualifiedPipeline.key()).isEqualTo("qualifiedPipeline");
        assertThat(qualifiedPipeline.value()).isEqualTo("$4K");
        assertThat(qualifiedPipeline.change()).isEqualTo("+100%");
        assertThat(qualifiedPipeline.context()).isEqualTo("from 5 active opportunities");

        PipelineMetricResponse salesCycle = response.pipelineMetrics().get(1);
        assertThat(salesCycle.key()).isEqualTo("salesCycle");
        assertThat(salesCycle.value()).isEqualTo("21.5 days");
        assertThat(salesCycle.change()).isEqualTo("+9.5 days");

        PipelineMetricResponse expansionRevenue = response.pipelineMetrics().get(2);
        assertThat(expansionRevenue.key()).isEqualTo("expansionRevenue");
        assertThat(expansionRevenue.value()).isEqualTo("$4K");
        assertThat(expansionRevenue.change()).isEqualTo("+100%");
        assertThat(expansionRevenue.context()).isEqualTo("from existing customer revenue");
    }

    private RevenueRecord revenueRecord(
        Long id,
        String customerName,
        String amount,
        RevenueStatus status,
        LocalDate date
    ) {
        return RevenueRecord.builder()
            .id(id)
            .customerName(customerName)
            .amount(new BigDecimal(amount))
            .status(status)
            .date(date)
            .build();
    }
}
