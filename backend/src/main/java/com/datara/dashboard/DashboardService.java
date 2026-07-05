package com.datara.dashboard;

import com.datara.common.DashboardTimeRange;
import com.datara.analytics.model.DashboardForecast;
import com.datara.analytics.repository.DashboardForecastRepository;
import com.datara.dashboard.dto.DashboardPanelsResponse;
import com.datara.dashboard.dto.DashboardSummaryResponse;
import com.datara.dashboard.dto.ForecastActiveResponse;
import com.datara.dashboard.dto.KpiMetric;
import com.datara.dashboard.dto.PipelineMetricResponse;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueRepository;
import com.datara.revenue.RevenueStatus;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Builds the dashboard KPI summary for a selected {@link DashboardTimeRange},
 * comparing the selected window against the equal-length window immediately
 * before it (e.g. the last 30 days vs the 30 days before that) so the
 * frontend can render real delta badges instead of hardcoded copy.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final int MONEY_SCALE = 2;
    private static final int PERCENT_SCALE = 2;

    private static final String DIRECTION_UP = "UP";
    private static final String DIRECTION_DOWN = "DOWN";
    private static final String DIRECTION_FLAT = "FLAT";
    private static final String DIRECTION_NEW = "NEW";
    private static final String DIRECTION_NONE = "NONE";

    private static final List<RevenueStatus> ACTIVE_PIPELINE_STATUSES = List.of(
        RevenueStatus.LEAD,
        RevenueStatus.NEGOTIATION
    );
    private static final BigDecimal LEAD_FORECAST_WEIGHT = new BigDecimal("0.25");
    private static final BigDecimal NEGOTIATION_FORECAST_WEIGHT = new BigDecimal("0.65");
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal ONE_THOUSAND = BigDecimal.valueOf(1_000);
    private static final BigDecimal ONE_MILLION = BigDecimal.valueOf(1_000_000);
    private static final BigDecimal DEFAULT_SALES_CYCLE_DAYS = BigDecimal.valueOf(18);

    private final DashboardForecastRepository dashboardForecastRepository;
    private final RevenueRepository revenueRepository;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = range.startDate(today);
        LocalDate currentEnd = range.endDateExclusive(today);
        LocalDate previousStart = range.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        return new DashboardSummaryResponse(
            netRevenueMetric(userId, currentStart, currentEnd, previousStart, previousEnd),
            customersMetric(userId, currentStart, currentEnd, previousStart, previousEnd),
            averageDealSizeMetric(userId, currentStart, currentEnd, previousStart, previousEnd),
            winRateMetric(userId, currentStart, currentEnd, previousStart, previousEnd)
        );
    }

    @Transactional(readOnly = true)
    public DashboardPanelsResponse getPanels(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = range.startDate(today);
        LocalDate currentEnd = range.endDateExclusive(today);
        LocalDate previousStart = range.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        return new DashboardPanelsResponse(
            forecastActive(userId, range, currentStart, currentEnd),
            List.of(
                qualifiedPipelineMetric(
                    userId,
                    currentStart,
                    currentEnd,
                    previousStart,
                    previousEnd
                ),
                salesCycleMetric(userId, currentStart, currentEnd, previousStart, previousEnd),
                expansionRevenueMetric(
                    userId,
                    currentStart,
                    currentEnd,
                    previousStart,
                    previousEnd
                )
            )
        );
    }

    private ForecastActiveResponse forecastActive(
        Long userId,
        DashboardTimeRange range,
        LocalDate currentStart,
        LocalDate currentEnd
    ) {
        BigDecimal projectedRevenue = forecastRevenueForRange(userId, currentStart, currentEnd);
        BigDecimal weightedPipeline = weightedActivePipeline(userId, currentStart, currentEnd);
        BigDecimal forecastRevenue = projectedRevenue
            .add(weightedPipeline)
            .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        return new ForecastActiveResponse(
            forecastRevenue,
            formatCompactCurrency(forecastRevenue),
            rangeLabel(range),
            forecastDescription(range)
        );
    }

    private PipelineMetricResponse qualifiedPipelineMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal currentPipeline = zeroIfNull(
            revenueRepository.sumAmountByUserIdAndStatusesBetweenDates(
                userId,
                ACTIVE_PIPELINE_STATUSES,
                currentStart,
                currentEnd
            )
        );
        BigDecimal previousPipeline = zeroIfNull(
            revenueRepository.sumAmountByUserIdAndStatusesBetweenDates(
                userId,
                ACTIVE_PIPELINE_STATUSES,
                previousStart,
                previousEnd
            )
        );
        long activeOpportunities = revenueRepository.countByUserIdAndStatusesBetweenDates(
            userId,
            ACTIVE_PIPELINE_STATUSES,
            currentStart,
            currentEnd
        );

        return new PipelineMetricResponse(
            "qualifiedPipeline",
            "Qualified pipeline",
            formatCompactCurrency(currentPipeline),
            formatSignedPercentChange(currentPipeline, previousPipeline),
            "from " + activeOpportunities + " active opportunities"
        );
    }

    private PipelineMetricResponse salesCycleMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal currentDays = estimatedSalesCycleDays(
            revenueRepository.findByUserIdBetweenDates(userId, currentStart, currentEnd)
        );
        BigDecimal previousDays = estimatedSalesCycleDays(
            revenueRepository.findByUserIdBetweenDates(userId, previousStart, previousEnd)
        );

        return new PipelineMetricResponse(
            "salesCycle",
            "Sales cycle",
            formatDays(currentDays),
            formatSignedDays(currentDays, previousDays),
            "estimated from pipeline status mix"
        );
    }

    private PipelineMetricResponse expansionRevenueMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal currentExpansion = expansionRevenue(userId, currentStart, currentEnd);
        BigDecimal previousExpansion = expansionRevenue(userId, previousStart, previousEnd);

        return new PipelineMetricResponse(
            "expansionRevenue",
            "Expansion revenue",
            formatCompactCurrency(currentExpansion),
            formatSignedPercentChange(currentExpansion, previousExpansion),
            "from existing customer revenue"
        );
    }

    /** Net Revenue: won revenue in the selected range vs the previous equal range. */
    private KpiMetric netRevenueMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal current = wonRevenueForPeriod(userId, currentStart, currentEnd);
        BigDecimal previous = wonRevenueForPeriod(userId, previousStart, previousEnd);

        return buildMetric(current, previous);
    }

    /** Customers: distinct customers in the selected range vs the previous equal range. */
    private KpiMetric customersMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal current = BigDecimal.valueOf(
            revenueRepository.countDistinctCustomersByUserIdBetweenDates(
                userId, currentStart, currentEnd
            )
        );
        BigDecimal previous = BigDecimal.valueOf(
            revenueRepository.countDistinctCustomersByUserIdBetweenDates(
                userId, previousStart, previousEnd
            )
        );

        return buildMetric(current, previous);
    }

    /** Avg. Deal Size: average WON deal size in the selected range vs previous range. */
    private KpiMetric averageDealSizeMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal current = averageWonDealSize(userId, currentStart, currentEnd);
        BigDecimal previous = averageWonDealSize(userId, previousStart, previousEnd);

        return buildMetric(current, previous);
    }

    /** Win Rate: WON deals / (WON + LOST) in the selected range vs previous range. */
    private KpiMetric winRateMetric(
        Long userId,
        LocalDate currentStart,
        LocalDate currentEnd,
        LocalDate previousStart,
        LocalDate previousEnd
    ) {
        BigDecimal current = winRateForPeriod(userId, currentStart, currentEnd);
        BigDecimal previous = winRateForPeriod(userId, previousStart, previousEnd);

        return buildMetric(current, previous);
    }

    private BigDecimal wonRevenueForPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        BigDecimal revenue = zeroIfNull(revenueRepository.sumAmountByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, startDate, endDate
        ));

        return revenue.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal averageWonDealSize(Long userId, LocalDate startDate, LocalDate endDate) {
        long wonDeals = revenueRepository.countByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, startDate, endDate
        );
        BigDecimal wonRevenue = wonRevenueForPeriod(userId, startDate, endDate);

        BigDecimal average = wonDeals == 0
            ? BigDecimal.ZERO
            : wonRevenue.divide(BigDecimal.valueOf(wonDeals), MONEY_SCALE, RoundingMode.HALF_UP);

        return average.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal winRateForPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        long wonDeals = revenueRepository.countByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, startDate, endDate
        );
        long lostDeals = revenueRepository.countByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.LOST, startDate, endDate
        );
        long closedDeals = wonDeals + lostDeals;

        BigDecimal rate = closedDeals == 0
            ? BigDecimal.ZERO
            : BigDecimal.valueOf(wonDeals)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(closedDeals), PERCENT_SCALE, RoundingMode.HALF_UP);

        return rate.setScale(PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    /**
     * Computes the delta between two periods, guarding against divide-by-zero.
     * When {@code previous} is zero, {@code deltaPercent} is left {@code null}
     * rather than producing Infinity/NaN - direction becomes "NEW" if there is
     * current-period activity, or "NONE" if both periods are empty.
     */
    private KpiMetric buildMetric(BigDecimal current, BigDecimal previous) {
        BigDecimal deltaValue = current.subtract(previous);

        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            String direction = current.compareTo(BigDecimal.ZERO) == 0
                ? DIRECTION_NONE
                : DIRECTION_NEW;

            return new KpiMetric(current, previous, deltaValue, null, direction);
        }

        BigDecimal deltaPercent = deltaValue
            .multiply(BigDecimal.valueOf(100))
            .divide(previous.abs(), PERCENT_SCALE, RoundingMode.HALF_UP);

        String direction;
        if (deltaValue.compareTo(BigDecimal.ZERO) > 0) {
            direction = DIRECTION_UP;
        } else if (deltaValue.compareTo(BigDecimal.ZERO) < 0) {
            direction = DIRECTION_DOWN;
        } else {
            direction = DIRECTION_FLAT;
        }

        return new KpiMetric(current, previous, deltaValue, deltaPercent, direction);
    }

    private BigDecimal weightedActivePipeline(
        Long userId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        BigDecimal leadPipeline = zeroIfNull(
            revenueRepository.sumAmountByUserIdAndStatusBetweenDates(
                userId,
                RevenueStatus.LEAD,
                startDate,
                endDate
            )
        );
        BigDecimal negotiationPipeline = zeroIfNull(
            revenueRepository.sumAmountByUserIdAndStatusBetweenDates(
                userId,
                RevenueStatus.NEGOTIATION,
                startDate,
                endDate
            )
        );

        return leadPipeline
            .multiply(LEAD_FORECAST_WEIGHT)
            .add(negotiationPipeline.multiply(NEGOTIATION_FORECAST_WEIGHT))
            .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal forecastRevenueForRange(
        Long userId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        List<DashboardForecast> forecasts = dashboardForecastRepository.findByUserId(userId);

        if (forecasts.isEmpty()) {
            return BigDecimal.ZERO.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }

        Map<YearMonth, DashboardForecast> forecastByMonth = new HashMap<>();

        for (DashboardForecast forecast : forecasts) {
            forecastByMonth.putIfAbsent(YearMonth.from(forecast.getMonth()), forecast);
        }

        BigDecimal revenue = BigDecimal.ZERO;
        LocalDate cursor = startDate;

        while (cursor.isBefore(endDate)) {
            YearMonth month = YearMonth.from(cursor);
            LocalDate monthEndExclusive = month.atEndOfMonth().plusDays(1);
            LocalDate bucketEnd = monthEndExclusive.isBefore(endDate)
                ? monthEndExclusive
                : endDate;
            DashboardForecast forecast = forecastByMonth.get(month);

            if (forecast != null) {
                long overlapDays = ChronoUnit.DAYS.between(cursor, bucketEnd);
                BigDecimal proratedRevenue = zeroIfNull(forecast.getPredictedRevenue())
                    .multiply(BigDecimal.valueOf(overlapDays))
                    .divide(
                        BigDecimal.valueOf(month.lengthOfMonth()),
                        MONEY_SCALE + 4,
                        RoundingMode.HALF_UP
                    );
                revenue = revenue.add(proratedRevenue);
            }

            cursor = bucketEnd;
        }

        return revenue.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal estimatedSalesCycleDays(List<RevenueRecord> records) {
        if (records.isEmpty()) {
            return DEFAULT_SALES_CYCLE_DAYS.setScale(1, RoundingMode.HALF_UP);
        }

        BigDecimal weightedTotal = records.stream()
            .map(record -> statusCycleWeight(record.getStatus()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return weightedTotal
            .divide(BigDecimal.valueOf(records.size()), 1, RoundingMode.HALF_UP);
    }

    private BigDecimal statusCycleWeight(RevenueStatus status) {
        return switch (status) {
            case LEAD -> BigDecimal.valueOf(32);
            case NEGOTIATION -> BigDecimal.valueOf(18);
            case WON -> BigDecimal.valueOf(12);
            case LOST -> BigDecimal.valueOf(24);
        };
    }

    private BigDecimal expansionRevenue(
        Long userId,
        LocalDate startDate,
        LocalDate endDate
    ) {
        Set<String> customersWithPriorWonDeals = new HashSet<>(
            revenueRepository.findCustomerNamesByUserIdAndStatusBeforeDate(
                userId,
                RevenueStatus.WON,
                startDate
            )
        );
        Set<String> customersSeenInWindow = new HashSet<>();
        List<RevenueRecord> wonRecords = new ArrayList<>(
            revenueRepository.findByUserIdAndStatusBetweenDates(
                userId,
                RevenueStatus.WON,
                startDate,
                endDate
            )
        );

        wonRecords.sort(
            Comparator
                .comparing(RevenueRecord::getDate)
                .thenComparing(record -> record.getId() == null ? Long.MAX_VALUE : record.getId())
        );

        BigDecimal expansionRevenue = BigDecimal.ZERO;

        for (RevenueRecord record : wonRecords) {
            String customerName = record.getCustomerName();
            boolean isExpansion = customersWithPriorWonDeals.contains(customerName)
                || customersSeenInWindow.contains(customerName);

            if (isExpansion) {
                expansionRevenue = expansionRevenue.add(zeroIfNull(record.getAmount()));
            }

            customersSeenInWindow.add(customerName);
        }

        return expansionRevenue.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private String rangeLabel(DashboardTimeRange range) {
        return switch (range) {
            case LAST_30_DAYS -> "Last 30 Days";
            case LAST_90_DAYS -> "Last 90 Days";
            case LAST_12_MONTHS -> "Last 12 Months";
        };
    }

    private String forecastDescription(DashboardTimeRange range) {
        return switch (range) {
            case LAST_30_DAYS -> "30-day forecast based on active pipeline";
            case LAST_90_DAYS -> "90-day forecast based on active pipeline";
            case LAST_12_MONTHS -> "12-month forecast based on projected revenue";
        };
    }

    private String formatCompactCurrency(BigDecimal amount) {
        BigDecimal safeAmount = zeroIfNull(amount);
        BigDecimal absoluteAmount = safeAmount.abs();
        String prefix = safeAmount.signum() < 0 ? "-$" : "$";

        if (absoluteAmount.compareTo(ONE_MILLION) >= 0) {
            return prefix + formatDecimal(
                absoluteAmount.divide(ONE_MILLION, 1, RoundingMode.HALF_UP)
            ) + "M";
        }

        if (absoluteAmount.compareTo(ONE_THOUSAND) >= 0) {
            return prefix + formatDecimal(
                absoluteAmount.divide(ONE_THOUSAND, 1, RoundingMode.HALF_UP)
            ) + "K";
        }

        return prefix + absoluteAmount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatSignedPercentChange(BigDecimal current, BigDecimal previous) {
        BigDecimal percentChange = percentChange(current, previous);

        if (percentChange.compareTo(BigDecimal.ZERO) == 0) {
            return "0%";
        }

        String prefix = percentChange.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";

        return prefix + formatDecimal(percentChange) + "%";
    }

    private BigDecimal percentChange(BigDecimal current, BigDecimal previous) {
        if (zeroIfNull(previous).compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }

        return zeroIfNull(current)
            .subtract(previous)
            .multiply(ONE_HUNDRED)
            .divide(previous.abs(), 1, RoundingMode.HALF_UP);
    }

    private String formatDays(BigDecimal days) {
        return formatDecimal(days) + " days";
    }

    private String formatSignedDays(BigDecimal currentDays, BigDecimal previousDays) {
        BigDecimal deltaDays = zeroIfNull(currentDays)
            .subtract(zeroIfNull(previousDays))
            .setScale(1, RoundingMode.HALF_UP);

        if (deltaDays.compareTo(BigDecimal.ZERO) == 0) {
            return "0 days";
        }

        String prefix = deltaDays.compareTo(BigDecimal.ZERO) > 0 ? "+" : "";

        return prefix + formatDecimal(deltaDays) + " days";
    }

    private String formatDecimal(BigDecimal value) {
        return zeroIfNull(value)
            .stripTrailingZeros()
            .toPlainString();
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
