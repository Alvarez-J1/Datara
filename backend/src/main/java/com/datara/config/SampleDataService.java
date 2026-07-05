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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
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

    private static final int MONTH_COUNT = 12;
    private static final int DEFAULT_RANDOM_SEED = 42;

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

        for (int monthOffset = 0; monthOffset < MONTH_COUNT; monthOffset++) {
            YearMonth yearMonth = YearMonth.from(firstMonth.plusMonths(monthOffset));
            int dealsThisMonth = 18 + (monthOffset % 5);
            BigDecimal seasonalMultiplier = seasonalMultiplier(yearMonth);

            for (int dealIndex = 0; dealIndex < dealsThisMonth; dealIndex++) {
                RevenueStatus status = pickStatus(monthOffset, dealIndex, random);
                String segment = pickSegment(dealIndex, random);
                BigDecimal amount = dealAmount(segment, seasonalMultiplier, random);
                LocalDate dealDate = yearMonth.atDay(
                    1 + random.nextInt(yearMonth.lengthOfMonth())
                );

                records.add(RevenueRecord.builder()
                    .user(user)
                    .customerName(customerName(monthOffset, dealIndex))
                    .amount(amount)
                    .status(status)
                    .date(dealDate)
                    .createdAt(dealDate.atStartOfDay().toInstant(java.time.ZoneOffset.UTC))
                    .build());
            }
        }

        return records;
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

    private String customerName(int monthOffset, int dealIndex) {
        String[] prefixes = {
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
        };
        String[] suffixes = {
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
        };

        int prefixIndex = Math.floorMod(monthOffset * 7 + dealIndex, prefixes.length);
        int suffixIndex = Math.floorMod(monthOffset + dealIndex * 3, suffixes.length);

        return prefixes[prefixIndex] + " " + suffixes[suffixIndex];
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
