package com.datara.analytics;

import com.datara.analytics.dto.ChartDataResponse;
import com.datara.analytics.dto.ChartDatasetResponse;
import com.datara.analytics.dto.RecentDealResponse;
import com.datara.analytics.model.AcquisitionSource;
import com.datara.analytics.model.DashboardForecast;
import com.datara.analytics.model.ProductMetric;
import com.datara.analytics.repository.AcquisitionSourceRepository;
import com.datara.analytics.repository.DashboardForecastRepository;
import com.datara.analytics.repository.ProductMetricRepository;
import com.datara.common.DashboardTimeRange;
import com.datara.revenue.RevenueDimensions;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueRepository;
import com.datara.revenue.RevenueStatus;
import com.datara.revenue.projection.StatusAggregateProjection;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.time.temporal.TemporalAdjusters;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final int PERCENT_SCALE = 2;

    // Fixed, stable label order so chart colors/legend positions stay
    // consistent across requests instead of reshuffling when a bucket is
    // empty for a given range.
    private static final List<String> CUSTOMER_SEGMENT_ORDER =
        List.of("Enterprise", "SMB", "Startup");
    private static final List<String> REGION_ORDER =
        List.of("North America", "Europe", "APAC");

    private final RevenueRepository revenueRepository;
    private final AcquisitionSourceRepository acquisitionSourceRepository;
    private final ProductMetricRepository productMetricRepository;
    private final DashboardForecastRepository dashboardForecastRepository;

    @Transactional(readOnly = true)
    public ChartDataResponse<BigDecimal> getRevenueTrend(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = chartStartDate(range, today);
        LocalDate endDate = today.plusDays(1);

        List<RevenueRecord> records = revenueRepository.findByUserIdAndStatusBetweenDates(
            userId,
            RevenueStatus.WON,
            startDate,
            endDate
        );

        TimeSeries<BigDecimal> revenue = revenueTimeSeries(records, range, today);

        return new ChartDataResponse<>(
            revenue.labels(),
            List.of(new ChartDatasetResponse<>("Revenue", revenue.data()))
        );
    }

    @Transactional(readOnly = true)
    public ChartDataResponse<Long> getSalesByStatus(Long userId) {
        List<StatusAggregateProjection> statusCounts =
            revenueRepository.countDealsByStatusForUser(userId);

        Map<RevenueStatus, Long> countsByStatus = new EnumMap<>(RevenueStatus.class);
        statusCounts.forEach(row -> countsByStatus.put(row.getStatus(), row.getDealCount()));

        List<String> labels = List.of(RevenueStatus.values()).stream()
            .map(RevenueStatus::name)
            .toList();

        List<Long> data = List.of(RevenueStatus.values()).stream()
            .map(status -> countsByStatus.getOrDefault(status, 0L))
            .toList();

        return new ChartDataResponse<>(
            labels,
            List.of(new ChartDatasetResponse<>("Deals", data))
        );
    }

    @Transactional(readOnly = true)
    public List<RecentDealResponse> getRecentDeals(Long userId) {
        List<RevenueRecord> records = revenueRepository.findRecentDealsByUserId(
            userId,
            PageRequest.of(0, 10)
        );

        return records.stream()
            .map(RecentDealResponse::from)
            .toList();
    }

    /**
     * Unlike region/customer-segment, "acquisition source" has no equivalent
     * derivable dimension anywhere on {@link RevenueRecord} (no field, and no
     * established stable-hash derivation like region/segment have). Faking
     * one purely to make this endpoint range-reactive would mean inventing a
     * dimension that doesn't exist in the real schema, so this intentionally
     * stays backed by the static seeded snapshot and does not accept a range
     * parameter. See the range-parameter rollout notes for this limitation.
     */
    @Transactional(readOnly = true)
    public ChartDataResponse<BigDecimal> getAcquisitionMix(Long userId) {
        List<AcquisitionSource> sources = acquisitionSourceRepository.findByUserId(userId);

        List<String> labels = sources.stream()
            .map(AcquisitionSource::getSourceName)
            .toList();

        List<BigDecimal> revenue = sources.stream()
            .map(source -> zeroIfNull(source.getRevenue()))
            .toList();

        return new ChartDataResponse<>(
            labels,
            List.of(new ChartDatasetResponse<>("Revenue", revenue))
        );
    }

    /** Customer segments, derived live from WON records in the selected range. */
    @Transactional(readOnly = true)
    public ChartDataResponse<Number> getCustomerSegments(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        List<RevenueRecord> records = revenueRepository.findByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, range.startDate(today), range.endDateExclusive(today)
        );

        Map<String, List<RevenueRecord>> bySegment = records.stream()
            .collect(Collectors.groupingBy(
                record -> RevenueDimensions.resolveCustomerSegment(record.getAmount())
            ));

        List<Number> customerCounts = CUSTOMER_SEGMENT_ORDER.stream()
            .map(segment -> (Number) distinctCustomerCount(bySegment.get(segment)))
            .toList();
        List<Number> revenue = CUSTOMER_SEGMENT_ORDER.stream()
            .map(segment -> (Number) sumAmount(bySegment.get(segment)))
            .toList();

        return new ChartDataResponse<>(
            CUSTOMER_SEGMENT_ORDER,
            List.of(
                new ChartDatasetResponse<>("Customers", customerCounts),
                new ChartDatasetResponse<>("Revenue", revenue)
            )
        );
    }

    @Transactional(readOnly = true)
    public ChartDataResponse<Number> getProductMetrics(Long userId) {
        List<ProductMetric> products = productMetricRepository.findByUserId(userId);

        List<String> labels = products.stream()
            .map(ProductMetric::getProductName)
            .toList();

        List<Number> revenue = products.stream()
            .map(product -> (Number) zeroIfNull(product.getRevenue()))
            .toList();

        List<Number> unitsSold = products.stream()
            .map(product -> (Number) zeroIfNull(product.getUnitsSold()))
            .toList();

        return new ChartDataResponse<>(
            labels,
            List.of(
                new ChartDatasetResponse<>("Revenue", revenue),
                new ChartDatasetResponse<>("Units Sold", unitsSold)
            )
        );
    }

    /**
     * Region mix, derived live from WON records in the selected range. Growth
     * rate is a real percent change against the equal-length window
     * immediately before the selected range (same comparison the dashboard
     * KPIs use), not a stored/fabricated figure.
     */
    @Transactional(readOnly = true)
    public ChartDataResponse<Number> getRegionMix(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        LocalDate currentStart = range.startDate(today);
        LocalDate currentEnd = range.endDateExclusive(today);
        LocalDate previousStart = range.previousStartDate(today);
        LocalDate previousEnd = currentStart;

        List<RevenueRecord> currentRecords = revenueRepository.findByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, currentStart, currentEnd
        );
        List<RevenueRecord> previousRecords = revenueRepository.findByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, previousStart, previousEnd
        );

        Map<String, BigDecimal> currentRevenueByRegion =
            revenueByDimension(currentRecords, RevenueDimensions::resolveRegion);
        Map<String, BigDecimal> previousRevenueByRegion =
            revenueByDimension(previousRecords, RevenueDimensions::resolveRegion);

        List<Number> revenue = REGION_ORDER.stream()
            .map(region -> (Number) currentRevenueByRegion.getOrDefault(region, BigDecimal.ZERO))
            .toList();
        List<Number> growthRate = REGION_ORDER.stream()
            .map(region -> (Number) safePercentChange(
                currentRevenueByRegion.getOrDefault(region, BigDecimal.ZERO),
                previousRevenueByRegion.getOrDefault(region, BigDecimal.ZERO)
            ))
            .toList();

        return new ChartDataResponse<>(
            REGION_ORDER,
            List.of(
                new ChartDatasetResponse<>("Revenue", revenue),
                new ChartDatasetResponse<>("Growth Rate", growthRate)
            )
        );
    }

    @Transactional(readOnly = true)
    public ChartDataResponse<BigDecimal> getForecastTrend(
        Long userId,
        DashboardTimeRange range
    ) {
        List<DashboardForecast> forecasts = dashboardForecastRepository.findByUserId(userId);
        TimeSeries<ForecastBucket> series = forecastTimeSeries(forecasts, range, LocalDate.now());

        List<BigDecimal> predictedRevenue = series.data().stream()
            .map(ForecastBucket::predictedRevenue)
            .toList();
        List<BigDecimal> actualRevenue = series.data().stream()
            .map(ForecastBucket::actualRevenue)
            .toList();

        return new ChartDataResponse<>(
            series.labels(),
            List.of(
                new ChartDatasetResponse<>("Predicted Revenue", predictedRevenue),
                new ChartDatasetResponse<>("Actual Revenue", actualRevenue)
            )
        );
    }

    /**
     * Real month-over-month customer retention, computed from WON records in
     * and just before the selected range: for each calendar month touched by
     * the range, "retained" customers are those with a WON deal in that month
     * and the month before, "churned" are those who had one the month before
     * but not this month. No stored/fabricated retention figures - this is a
     * real cohort calculation over the seeded revenue records.
     */
    @Transactional(readOnly = true)
    public ChartDataResponse<BigDecimal> getRetention(Long userId, DashboardTimeRange range) {
        LocalDate today = LocalDate.now();
        LocalDate rangeStart = range.startDate(today);
        LocalDate rangeEnd = range.endDateExclusive(today);

        YearMonth firstMonth = YearMonth.from(rangeStart);
        YearMonth lastMonth = YearMonth.from(today);
        LocalDate fetchStart = firstMonth.minusMonths(1).atDay(1);

        List<RevenueRecord> wonRecords = revenueRepository.findByUserIdAndStatusBetweenDates(
            userId, RevenueStatus.WON, fetchStart, rangeEnd
        );

        Map<YearMonth, Set<String>> customersByMonth = new HashMap<>();
        for (RevenueRecord record : wonRecords) {
            customersByMonth
                .computeIfAbsent(YearMonth.from(record.getDate()), key -> new HashSet<>())
                .add(record.getCustomerName());
        }

        List<String> labels = new ArrayList<>();
        List<BigDecimal> retentionRates = new ArrayList<>();

        for (YearMonth month = firstMonth; !month.isAfter(lastMonth); month = month.plusMonths(1)) {
            Set<String> current = customersByMonth.getOrDefault(month, Set.of());
            Set<String> previous = customersByMonth.getOrDefault(month.minusMonths(1), Set.of());

            long retained = current.stream().filter(previous::contains).count();
            long churned = previous.stream().filter(name -> !current.contains(name)).count();
            long denominator = retained + churned;

            BigDecimal rate = denominator == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(retained)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(denominator), PERCENT_SCALE, RoundingMode.HALF_UP);

            labels.add(month.toString());
            retentionRates.add(rate);
        }

        return new ChartDataResponse<>(
            labels,
            List.of(new ChartDatasetResponse<>("Retention Rate", retentionRates))
        );
    }

    private Map<String, BigDecimal> revenueByDimension(
        List<RevenueRecord> records,
        Function<String, String> dimensionResolver
    ) {
        return records.stream().collect(Collectors.groupingBy(
            record -> dimensionResolver.apply(record.getCustomerName()),
            Collectors.reducing(BigDecimal.ZERO, RevenueRecord::getAmount, BigDecimal::add)
        ));
    }

    private long distinctCustomerCount(List<RevenueRecord> records) {
        if (records == null) {
            return 0L;
        }
        return records.stream().map(RevenueRecord::getCustomerName).distinct().count();
    }

    private BigDecimal sumAmount(List<RevenueRecord> records) {
        if (records == null) {
            return BigDecimal.ZERO;
        }
        return records.stream()
            .map(RevenueRecord::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Safe percent change: 0 (not Infinity/NaN) when there's no prior-period baseline. */
    private BigDecimal safePercentChange(BigDecimal current, BigDecimal previous) {
        if (previous.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }

        return current.subtract(previous)
            .multiply(BigDecimal.valueOf(100))
            .divide(previous.abs(), PERCENT_SCALE, RoundingMode.HALF_UP);
    }

    private TimeSeries<BigDecimal> revenueTimeSeries(
        List<RevenueRecord> records,
        DashboardTimeRange range,
        LocalDate today
    ) {
        return switch (range) {
            case LAST_30_DAYS -> dailyRevenueTimeSeries(records, chartStartDate(range, today), today.plusDays(1));
            case LAST_90_DAYS -> weeklyRevenueTimeSeries(records, chartStartDate(range, today), today.plusDays(1));
            case LAST_12_MONTHS -> monthlyRevenueTimeSeries(records, YearMonth.from(chartStartDate(range, today)), YearMonth.from(today));
        };
    }

    private TimeSeries<BigDecimal> dailyRevenueTimeSeries(
        List<RevenueRecord> records,
        LocalDate startDate,
        LocalDate endDate
    ) {
        Map<LocalDate, BigDecimal> revenueByDay = records.stream()
            .collect(Collectors.groupingBy(
                RevenueRecord::getDate,
                Collectors.reducing(BigDecimal.ZERO, RevenueRecord::getAmount, BigDecimal::add)
            ));

        List<String> labels = new ArrayList<>();
        List<BigDecimal> data = new ArrayList<>();

        for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
            labels.add(date.toString());
            data.add(revenueByDay.getOrDefault(date, BigDecimal.ZERO));
        }

        return new TimeSeries<>(labels, data);
    }

    private TimeSeries<BigDecimal> weeklyRevenueTimeSeries(
        List<RevenueRecord> records,
        LocalDate startDate,
        LocalDate endDate
    ) {
        Map<LocalDate, BigDecimal> revenueByWeek = records.stream()
            .collect(Collectors.groupingBy(
                record -> weekStart(record.getDate()),
                Collectors.reducing(BigDecimal.ZERO, RevenueRecord::getAmount, BigDecimal::add)
            ));

        List<String> labels = new ArrayList<>();
        List<BigDecimal> data = new ArrayList<>();

        for (
            LocalDate weekStart = weekStart(startDate);
            weekStart.isBefore(endDate);
            weekStart = weekStart.plusWeeks(1)
        ) {
            labels.add(weekStart.toString());
            data.add(revenueByWeek.getOrDefault(weekStart, BigDecimal.ZERO));
        }

        return new TimeSeries<>(labels, data);
    }

    private TimeSeries<BigDecimal> monthlyRevenueTimeSeries(
        List<RevenueRecord> records,
        YearMonth firstMonth,
        YearMonth lastMonth
    ) {
        Map<YearMonth, BigDecimal> revenueByMonth = records.stream()
            .collect(Collectors.groupingBy(
                record -> YearMonth.from(record.getDate()),
                Collectors.reducing(BigDecimal.ZERO, RevenueRecord::getAmount, BigDecimal::add)
            ));

        List<String> labels = new ArrayList<>();
        List<BigDecimal> data = new ArrayList<>();

        for (
            YearMonth month = firstMonth;
            !month.isAfter(lastMonth);
            month = month.plusMonths(1)
        ) {
            labels.add(month.toString());
            data.add(revenueByMonth.getOrDefault(month, BigDecimal.ZERO));
        }

        return new TimeSeries<>(labels, data);
    }

    private TimeSeries<ForecastBucket> forecastTimeSeries(
        List<DashboardForecast> forecasts,
        DashboardTimeRange range,
        LocalDate today
    ) {
        Map<YearMonth, DashboardForecast> forecastByMonth = forecasts.stream()
            .collect(Collectors.toMap(
                forecast -> YearMonth.from(forecast.getMonth()),
                Function.identity(),
                (first, second) -> second
            ));

        LocalDate startDate = chartStartDate(range, today);
        LocalDate endDate = today.plusDays(1);

        return switch (range) {
            case LAST_30_DAYS -> dailyForecastTimeSeries(forecastByMonth, startDate, endDate);
            case LAST_90_DAYS -> weeklyForecastTimeSeries(forecastByMonth, startDate, endDate);
            case LAST_12_MONTHS -> monthlyForecastTimeSeries(
                forecastByMonth,
                YearMonth.from(startDate),
                YearMonth.from(today)
            );
        };
    }

    private TimeSeries<ForecastBucket> dailyForecastTimeSeries(
        Map<YearMonth, DashboardForecast> forecastByMonth,
        LocalDate startDate,
        LocalDate endDate
    ) {
        List<String> labels = new ArrayList<>();
        List<ForecastBucket> data = new ArrayList<>();

        for (LocalDate date = startDate; date.isBefore(endDate); date = date.plusDays(1)) {
            labels.add(date.toString());
            data.add(forecastForDate(forecastByMonth, date));
        }

        return new TimeSeries<>(labels, data);
    }

    private TimeSeries<ForecastBucket> weeklyForecastTimeSeries(
        Map<YearMonth, DashboardForecast> forecastByMonth,
        LocalDate startDate,
        LocalDate endDate
    ) {
        List<String> labels = new ArrayList<>();
        List<ForecastBucket> data = new ArrayList<>();

        for (
            LocalDate weekStart = weekStart(startDate);
            weekStart.isBefore(endDate);
            weekStart = weekStart.plusWeeks(1)
        ) {
            LocalDate bucketStart = weekStart.isBefore(startDate) ? startDate : weekStart;
            LocalDate bucketEnd = weekStart.plusWeeks(1).isAfter(endDate)
                ? endDate
                : weekStart.plusWeeks(1);

            ForecastBucket bucket = ForecastBucket.ZERO;
            for (
                LocalDate date = bucketStart;
                date.isBefore(bucketEnd);
                date = date.plusDays(1)
            ) {
                bucket = bucket.add(forecastForDate(forecastByMonth, date));
            }

            labels.add(weekStart.toString());
            data.add(bucket);
        }

        return new TimeSeries<>(labels, data);
    }

    private TimeSeries<ForecastBucket> monthlyForecastTimeSeries(
        Map<YearMonth, DashboardForecast> forecastByMonth,
        YearMonth firstMonth,
        YearMonth lastMonth
    ) {
        List<String> labels = new ArrayList<>();
        List<ForecastBucket> data = new ArrayList<>();

        for (
            YearMonth month = firstMonth;
            !month.isAfter(lastMonth);
            month = month.plusMonths(1)
        ) {
            DashboardForecast forecast = forecastByMonth.get(month);
            labels.add(month.toString());
            data.add(new ForecastBucket(
                forecast == null ? BigDecimal.ZERO : zeroIfNull(forecast.getPredictedRevenue()),
                forecast == null ? BigDecimal.ZERO : zeroIfNull(forecast.getActualRevenue())
            ));
        }

        return new TimeSeries<>(labels, data);
    }

    private ForecastBucket forecastForDate(
        Map<YearMonth, DashboardForecast> forecastByMonth,
        LocalDate date
    ) {
        YearMonth month = YearMonth.from(date);
        DashboardForecast forecast = forecastByMonth.get(month);

        if (forecast == null) {
            return ForecastBucket.ZERO;
        }

        BigDecimal daysInMonth = BigDecimal.valueOf(month.lengthOfMonth());

        return new ForecastBucket(
            zeroIfNull(forecast.getPredictedRevenue())
                .divide(daysInMonth, 2, RoundingMode.HALF_UP),
            zeroIfNull(forecast.getActualRevenue())
                .divide(daysInMonth, 2, RoundingMode.HALF_UP)
        );
    }

    private LocalDate chartStartDate(DashboardTimeRange range, LocalDate today) {
        return switch (range) {
            case LAST_30_DAYS -> today.minusDays(29);
            case LAST_90_DAYS -> today.minusDays(89);
            case LAST_12_MONTHS -> YearMonth.from(today).minusMonths(11).atDay(1);
        };
    }

    private LocalDate weekStart(LocalDate date) {
        return date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Long zeroIfNull(Long value) {
        return value == null ? 0L : value;
    }

    private record TimeSeries<T>(List<String> labels, List<T> data) {
    }

    private record ForecastBucket(BigDecimal predictedRevenue, BigDecimal actualRevenue) {
        private static final ForecastBucket ZERO =
            new ForecastBucket(BigDecimal.ZERO, BigDecimal.ZERO);

        private ForecastBucket add(ForecastBucket other) {
            return new ForecastBucket(
                predictedRevenue.add(other.predictedRevenue),
                actualRevenue.add(other.actualRevenue)
            );
        }
    }
}
