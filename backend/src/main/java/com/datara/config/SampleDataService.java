package com.datara.config;

import com.datara.analytics.model.AcquisitionSource;
import com.datara.analytics.model.CustomerSegment;
import com.datara.analytics.model.DashboardForecast;
import com.datara.analytics.model.ProductMetric;
import com.datara.analytics.model.RegionMetric;
import com.datara.analytics.model.RetentionMetric;
import com.datara.analytics.repository.AcquisitionSourceRepository;
import com.datara.analytics.repository.CustomerSegmentRepository;
import com.datara.analytics.repository.DashboardForecastRepository;
import com.datara.analytics.repository.ProductMetricRepository;
import com.datara.analytics.repository.RegionMetricRepository;
import com.datara.analytics.repository.RetentionMetricRepository;
import com.datara.revenue.RevenueRecord;
import com.datara.revenue.RevenueRepository;
import com.datara.revenue.RevenueStatus;
import com.datara.user.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Generates a starter set of revenue/analytics sample data for a user so the
 * dashboard isn't empty on day one. Used both for the seeded demo account
 * (see {@link DataSeeder}) and for every newly registered account (see
 * {@code AuthService.register}).
 */
@Service
@RequiredArgsConstructor
public class SampleDataService {

    // 24 months, not 12: the dashboard's KPI badges compare each selected
    // range (30 days / 90 days / 12 months) against the equal-length period
    // immediately before it. A 12-month range needs a full previous 12-month
    // window to compare against - 24 months back from today - or that prior
    // window is empty and every KPI looks like "New" even though it isn't.
    private static final int MONTH_COUNT = 24;
    private static final int DEFAULT_RANDOM_SEED = 42;

    // How many brand-new customer identities get "acquired" each month, on
    // top of whichever ones already exist. Deals are drawn from whatever
    // customer pool has been acquired so far, not from the full name space
    // up front - otherwise the distinct-customer count would be flat no
    // matter the selected time window instead of growing with it.
    private static final int NEW_CUSTOMERS_PER_MONTH = 6;

    // Chance a deal goes to a customer who was already active last month
    // instead of a uniformly random pick from the whole acquired pool - see
    // pickCustomerName() for why this matters for retention.
    private static final double REPEAT_CUSTOMER_PROBABILITY = 0.55;

    private static final List<String> CUSTOMER_NAME_PREFIXES = List.of(
        "Aurora",
        "Northstar",
        "Luma",
        "Helio",
        "BrightPath",
        "Evergreen",
        "Nova",
        "Cartwheel",
        "Grainline",
        "Meridian",
        "Clearwater",
        "Atlas",
        "Orbit",
        "SignalStack",
        "Pillar",
        "Summit",
        "Kinetic",
        "Sonar",
        "Vectorly",
        "Opal"
    );
    private static final List<String> CUSTOMER_NAME_SUFFIXES = List.of(
        "Labs",
        "Health",
        "Retail",
        "Systems",
        "Cloud",
        "Legal",
        "Finance",
        "Commerce",
        "Studio",
        "Analytics"
    );

    private final AcquisitionSourceRepository acquisitionSourceRepository;
    private final CustomerSegmentRepository customerSegmentRepository;
    private final DashboardForecastRepository dashboardForecastRepository;
    private final ProductMetricRepository productMetricRepository;
    private final RegionMetricRepository regionMetricRepository;
    private final RetentionMetricRepository retentionMetricRepository;
    private final RevenueRepository revenueRepository;

    @Transactional
    public void seedFor(User user) {
        resetExistingSampleData(user.getId());

        LocalDate firstMonth = YearMonth.now().minusMonths(MONTH_COUNT - 1).atDay(1);
        Random random = new Random(user.getId() != null ? user.getId() : DEFAULT_RANDOM_SEED);

        List<RevenueRecord> revenueRecords = buildRevenueRecords(user, firstMonth, random);
        revenueRepository.saveAll(revenueRecords);

        Map<YearMonth, BigDecimal> monthlyWonRevenue = calculateMonthlyWonRevenue(revenueRecords);
        BigDecimal totalWonRevenue = monthlyWonRevenue.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<AcquisitionSource> acquisitionSources =
            buildAcquisitionSources(user, totalWonRevenue);
        List<CustomerSegment> customerSegments =
            buildCustomerSegments(user, totalWonRevenue);
        List<ProductMetric> productMetrics =
            buildProductMetrics(user, totalWonRevenue);
        List<RegionMetric> regionMetrics =
            buildRegionMetrics(user, totalWonRevenue);
        List<DashboardForecast> dashboardForecasts =
            buildDashboardForecasts(user, firstMonth, monthlyWonRevenue);
        List<RetentionMetric> retentionMetrics =
            buildRetentionMetrics(user, firstMonth);

        acquisitionSourceRepository.saveAll(acquisitionSources);
        customerSegmentRepository.saveAll(customerSegments);
        productMetricRepository.saveAll(productMetrics);
        regionMetricRepository.saveAll(regionMetrics);
        dashboardForecastRepository.saveAll(dashboardForecasts);
        retentionMetricRepository.saveAll(retentionMetrics);
    }

    private void resetExistingSampleData(Long userId) {
        revenueRepository.deleteAllInBatch(revenueRepository.findByUserId(userId));
        acquisitionSourceRepository.deleteAllInBatch(
            acquisitionSourceRepository.findByUserId(userId)
        );
        customerSegmentRepository.deleteAllInBatch(
            customerSegmentRepository.findByUserId(userId)
        );
        productMetricRepository.deleteAllInBatch(productMetricRepository.findByUserId(userId));
        regionMetricRepository.deleteAllInBatch(regionMetricRepository.findByUserId(userId));
        dashboardForecastRepository.deleteAllInBatch(
            dashboardForecastRepository.findByUserId(userId)
        );
        retentionMetricRepository.deleteAllInBatch(
            retentionMetricRepository.findByUserId(userId)
        );
    }

    private List<RevenueRecord> buildRevenueRecords(
        User user,
        LocalDate firstMonth,
        Random random
    ) {
        List<RevenueRecord> records = new ArrayList<>();
        List<String> customerPool = buildShuffledCustomerPool(random);
        List<String> acquiredCustomers = new ArrayList<>();
        int nextPoolIndex = 0;
        List<String> previousMonthCustomers = new ArrayList<>();
        Set<String> currentMonthCustomers = new HashSet<>();

        for (int monthOffset = 0; monthOffset < MONTH_COUNT; monthOffset++) {
            YearMonth yearMonth = YearMonth.from(firstMonth.plusMonths(monthOffset));
            int dealsThisMonth = 18 + (monthOffset % 5);
            BigDecimal seasonalMultiplier = seasonalMultiplier(yearMonth);

            int newCustomersThisMonth = Math.min(
                NEW_CUSTOMERS_PER_MONTH,
                customerPool.size() - nextPoolIndex
            );
            for (int i = 0; i < newCustomersThisMonth; i++) {
                acquiredCustomers.add(customerPool.get(nextPoolIndex++));
            }

            previousMonthCustomers = new ArrayList<>(currentMonthCustomers);
            currentMonthCustomers = new HashSet<>();

            for (int dealIndex = 0; dealIndex < dealsThisMonth; dealIndex++) {
                RevenueStatus status = pickStatus(monthOffset, dealIndex, random);
                String segment = pickSegment(dealIndex, random);
                BigDecimal amount = dealAmount(segment, seasonalMultiplier, random);
                LocalDate dealDate = yearMonth.atDay(
                    1 + random.nextInt(yearMonth.lengthOfMonth())
                );
                String customerName = pickCustomerName(
                    acquiredCustomers,
                    previousMonthCustomers,
                    random
                );
                currentMonthCustomers.add(customerName);

                records.add(RevenueRecord.builder()
                    .user(user)
                    .customerName(customerName)
                    .amount(amount)
                    .status(status)
                    .date(dealDate)
                    .createdAt(dealDate.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                    .build());
            }
        }

        return records;
    }

    /**
     * Weights deals toward customers who were already active last month
     * (real repeat business) rather than drawing purely uniformly from the
     * whole acquired pool. Without this, month-over-month retention would
     * always compute to 0% once the pool grows past a couple dozen names -
     * a customer reappearing in back-to-back months by pure chance becomes
     * vanishingly unlikely, even though the total customer count still (and
     * correctly) grows with a wider date range.
     */
    private String pickCustomerName(
        List<String> acquiredCustomers,
        List<String> previousMonthCustomers,
        Random random
    ) {
        if (!previousMonthCustomers.isEmpty() && random.nextDouble() < REPEAT_CUSTOMER_PROBABILITY) {
            return previousMonthCustomers.get(random.nextInt(previousMonthCustomers.size()));
        }

        return acquiredCustomers.get(random.nextInt(acquiredCustomers.size()));
    }

    /**
     * All prefix/suffix combinations, shuffled with the user's own seeded
     * Random so customer "acquisition order" is deterministic per user but
     * not tied to the prefix/suffix list order.
     */
    private List<String> buildShuffledCustomerPool(Random random) {
        List<String> pool = new ArrayList<>();

        for (String prefix : CUSTOMER_NAME_PREFIXES) {
            for (String suffix : CUSTOMER_NAME_SUFFIXES) {
                pool.add(prefix + " " + suffix);
            }
        }

        Collections.shuffle(pool, random);
        return pool;
    }

    private Map<YearMonth, BigDecimal> calculateMonthlyWonRevenue(
        List<RevenueRecord> revenueRecords
    ) {
        Map<YearMonth, BigDecimal> revenueByMonth = new LinkedHashMap<>();

        for (RevenueRecord record : revenueRecords) {
            YearMonth month = YearMonth.from(record.getDate());
            revenueByMonth.putIfAbsent(month, BigDecimal.ZERO);

            if (record.getStatus() == RevenueStatus.WON) {
                revenueByMonth.put(month, revenueByMonth.get(month).add(record.getAmount()));
            }
        }

        return revenueByMonth;
    }

    private List<AcquisitionSource> buildAcquisitionSources(
        User user,
        BigDecimal totalRevenue
    ) {
        return List.of(
            acquisitionSource(user, "Organic", "42.00", percentageOf(totalRevenue, "42.00")),
            acquisitionSource(user, "Paid", "26.00", percentageOf(totalRevenue, "26.00")),
            acquisitionSource(user, "Referral", "20.00", percentageOf(totalRevenue, "20.00")),
            acquisitionSource(user, "Direct", "12.00", percentageOf(totalRevenue, "12.00"))
        );
    }

    private List<CustomerSegment> buildCustomerSegments(User user, BigDecimal totalRevenue) {
        return List.of(
            customerSegment(user, "Enterprise", 48, percentageOf(totalRevenue, "58.00")),
            customerSegment(user, "SMB", 112, percentageOf(totalRevenue, "29.00")),
            customerSegment(user, "Startup", 74, percentageOf(totalRevenue, "13.00"))
        );
    }

    private List<ProductMetric> buildProductMetrics(User user, BigDecimal totalRevenue) {
        return List.of(
            productMetric(user, "Datara Core", percentageOf(totalRevenue, "36.00"), 980),
            productMetric(user, "Forecasting Suite", percentageOf(totalRevenue, "24.00"), 420),
            productMetric(user, "Revenue Intelligence", percentageOf(totalRevenue, "18.00"), 360),
            productMetric(user, "Team Seats", percentageOf(totalRevenue, "14.00"), 1850),
            productMetric(user, "API Access", percentageOf(totalRevenue, "8.00"), 210)
        );
    }

    private List<RegionMetric> buildRegionMetrics(User user, BigDecimal totalRevenue) {
        return List.of(
            regionMetric(user, "NA", percentageOf(totalRevenue, "58.00"), "18.40"),
            regionMetric(user, "EU", percentageOf(totalRevenue, "27.00"), "12.80"),
            regionMetric(user, "APAC", percentageOf(totalRevenue, "15.00"), "21.60")
        );
    }

    private List<DashboardForecast> buildDashboardForecasts(
        User user,
        LocalDate firstMonth,
        Map<YearMonth, BigDecimal> monthlyWonRevenue
    ) {
        List<DashboardForecast> forecasts = new ArrayList<>();

        for (int monthOffset = 0; monthOffset < MONTH_COUNT; monthOffset++) {
            YearMonth yearMonth = YearMonth.from(firstMonth.plusMonths(monthOffset));
            BigDecimal actualRevenue = monthlyWonRevenue.getOrDefault(yearMonth, BigDecimal.ZERO);
            BigDecimal forecastFactor = BigDecimal.valueOf(0.94 + (monthOffset % 5) * 0.035);

            forecasts.add(DashboardForecast.builder()
                .user(user)
                .month(yearMonth.atDay(1))
                .predictedRevenue(money(actualRevenue.multiply(forecastFactor)))
                .actualRevenue(actualRevenue)
                .build());
        }

        return forecasts;
    }

    private List<RetentionMetric> buildRetentionMetrics(User user, LocalDate firstMonth) {
        List<RetentionMetric> retentionMetrics = new ArrayList<>();

        for (int monthOffset = 0; monthOffset < MONTH_COUNT; monthOffset++) {
            YearMonth yearMonth = YearMonth.from(firstMonth.plusMonths(monthOffset));
            long retained = 168L + monthOffset * 7L;
            long churned = 12L - (monthOffset % 4L);
            BigDecimal retentionRate = BigDecimal.valueOf(retained)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(retained + churned), 2, RoundingMode.HALF_UP);

            retentionMetrics.add(RetentionMetric.builder()
                .user(user)
                .month(yearMonth.atDay(1))
                .retainedCustomers(retained)
                .churnedCustomers(churned)
                .retentionRate(retentionRate)
                .build());
        }

        return retentionMetrics;
    }

    private RevenueStatus pickStatus(int monthOffset, int dealIndex, Random random) {
        double roll = random.nextDouble();

        if (monthOffset >= MONTH_COUNT - 2) {
            if (roll < 0.42) {
                return RevenueStatus.WON;
            }
            if (roll < 0.62) {
                return RevenueStatus.NEGOTIATION;
            }
            if (roll < 0.82) {
                return RevenueStatus.LEAD;
            }
            return RevenueStatus.LOST;
        }

        if (dealIndex % 13 == 0) {
            return RevenueStatus.NEGOTIATION;
        }
        if (roll < 0.66) {
            return RevenueStatus.WON;
        }
        if (roll < 0.80) {
            return RevenueStatus.LOST;
        }
        if (roll < 0.91) {
            return RevenueStatus.NEGOTIATION;
        }
        return RevenueStatus.LEAD;
    }

    private String pickSegment(int dealIndex, Random random) {
        double roll = random.nextDouble();

        if (dealIndex % 7 == 0 || roll < 0.28) {
            return "Enterprise";
        }
        if (roll < 0.74) {
            return "SMB";
        }
        return "Startup";
    }

    private BigDecimal dealAmount(
        String segment,
        BigDecimal seasonalMultiplier,
        Random random
    ) {
        Map<String, BigDecimal> segmentBase = new LinkedHashMap<>();
        segmentBase.put("Enterprise", BigDecimal.valueOf(18500));
        segmentBase.put("SMB", BigDecimal.valueOf(6400));
        segmentBase.put("Startup", BigDecimal.valueOf(2400));

        BigDecimal randomFactor = BigDecimal.valueOf(0.82 + random.nextDouble() * 0.56);
        BigDecimal amount = segmentBase.get(segment)
            .multiply(seasonalMultiplier)
            .multiply(randomFactor);

        return money(amount);
    }

    private BigDecimal seasonalMultiplier(YearMonth yearMonth) {
        int month = yearMonth.getMonthValue();

        if (month >= 10) {
            return BigDecimal.valueOf(1.32);
        }
        if (month == 3 || month == 6 || month == 9) {
            return BigDecimal.valueOf(1.12);
        }
        if (month == 1 || month == 2) {
            return BigDecimal.valueOf(0.88);
        }
        return BigDecimal.ONE;
    }

    private AcquisitionSource acquisitionSource(
        User user,
        String sourceName,
        String percentage,
        BigDecimal revenue
    ) {
        return AcquisitionSource.builder()
            .user(user)
            .sourceName(sourceName)
            .percentage(new BigDecimal(percentage))
            .revenue(revenue)
            .build();
    }

    private CustomerSegment customerSegment(
        User user,
        String segmentName,
        long customerCount,
        BigDecimal revenue
    ) {
        return CustomerSegment.builder()
            .user(user)
            .segmentName(segmentName)
            .customerCount(customerCount)
            .revenue(revenue)
            .build();
    }

    private ProductMetric productMetric(
        User user,
        String productName,
        BigDecimal revenue,
        long unitsSold
    ) {
        return ProductMetric.builder()
            .user(user)
            .productName(productName)
            .revenue(revenue)
            .unitsSold(unitsSold)
            .build();
    }

    private RegionMetric regionMetric(
        User user,
        String regionName,
        BigDecimal revenue,
        String growthRate
    ) {
        return RegionMetric.builder()
            .user(user)
            .regionName(regionName)
            .revenue(revenue)
            .growthRate(new BigDecimal(growthRate))
            .build();
    }

    private BigDecimal percentageOf(BigDecimal value, String percentage) {
        return money(value.multiply(new BigDecimal(percentage))
            .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }
}
