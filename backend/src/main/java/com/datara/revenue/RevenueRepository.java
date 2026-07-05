package com.datara.revenue;

import com.datara.revenue.projection.MonthlyRevenueProjection;
import com.datara.revenue.projection.StatusAggregateProjection;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RevenueRepository extends JpaRepository<RevenueRecord, Long> {

    @Query("select r from RevenueRecord r where r.user.id = :userId")
    List<RevenueRecord> findByUserId(Long userId);

    @Query("""
        select sum(r.amount)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
        """)
    BigDecimal sumAmountByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status
    );

    @Query("""
        select sum(r.amount)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
          and r.date >= :startDate
          and r.date < :endDate
        """)
    BigDecimal sumAmountByUserIdAndStatusBetweenDates(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select sum(r.amount)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status in :statuses
          and r.date >= :startDate
          and r.date < :endDate
        """)
    BigDecimal sumAmountByUserIdAndStatusesBetweenDates(
        @Param("userId") Long userId,
        @Param("statuses") Collection<RevenueStatus> statuses,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select count(distinct r.customerName)
        from RevenueRecord r
        where r.user.id = :userId
        """)
    long countDistinctCustomersByUserId(@Param("userId") Long userId);

    @Query("""
        select count(r)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
        """)
    long countByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status
    );

    @Query("""
        select count(r)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status in :statuses
        """)
    long countByUserIdAndStatuses(
        @Param("userId") Long userId,
        @Param("statuses") Collection<RevenueStatus> statuses
    );

    @Query("""
        select count(r)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
          and r.date >= :startDate
          and r.date < :endDate
        """)
    long countByUserIdAndStatusBetweenDates(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select count(r)
        from RevenueRecord r
        where r.user.id = :userId
          and r.status in :statuses
          and r.date >= :startDate
          and r.date < :endDate
        """)
    long countByUserIdAndStatusesBetweenDates(
        @Param("userId") Long userId,
        @Param("statuses") Collection<RevenueStatus> statuses,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select count(distinct r.customerName)
        from RevenueRecord r
        where r.user.id = :userId
          and r.date >= :startDate
          and r.date < :endDate
        """)
    long countDistinctCustomersByUserIdBetweenDates(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select year(r.date) as year,
               month(r.date) as month,
               sum(r.amount) as revenue
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
        group by year(r.date), month(r.date)
        order by year(r.date), month(r.date)
        """)
    List<MonthlyRevenueProjection> findMonthlyRevenueByUserIdAndStatus(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status
    );

    @Query("""
        select year(r.date) as year,
               month(r.date) as month,
               sum(r.amount) as revenue
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
          and r.date >= :startDate
          and r.date < :endDate
        group by year(r.date), month(r.date)
        order by year(r.date), month(r.date)
        """)
    List<MonthlyRevenueProjection> findMonthlyRevenueByUserIdAndStatusBetweenDates(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    /**
     * Full entities (not just aggregates) so callers can derive per-record
     * dimensions - region, customer segment - the same deterministic way the
     * Revenue Data table does, then aggregate them for a given date range.
     */
    @Query("""
        select r
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
          and r.date >= :startDate
          and r.date < :endDate
        """)
    List<RevenueRecord> findByUserIdAndStatusBetweenDates(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select r
        from RevenueRecord r
        where r.user.id = :userId
          and r.date >= :startDate
          and r.date < :endDate
        """)
    List<RevenueRecord> findByUserIdBetweenDates(
        @Param("userId") Long userId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select r.customerName
        from RevenueRecord r
        where r.user.id = :userId
          and r.status = :status
          and r.date < :endDate
        """)
    List<String> findCustomerNamesByUserIdAndStatusBeforeDate(
        @Param("userId") Long userId,
        @Param("status") RevenueStatus status,
        @Param("endDate") LocalDate endDate
    );

    @Query("""
        select r.status as status,
               count(r) as dealCount
        from RevenueRecord r
        where r.user.id = :userId
        group by r.status
        order by r.status
        """)
    List<StatusAggregateProjection> countDealsByStatusForUser(
        @Param("userId") Long userId
    );

    @Query("""
        select r
        from RevenueRecord r
        where r.user.id = :userId
        order by r.date desc, r.createdAt desc, r.id desc
        """)
    List<RevenueRecord> findRecentDealsByUserId(
        @Param("userId") Long userId,
        Pageable pageable
    );

    @Query("""
        select r
        from RevenueRecord r
        where r.user.id = :userId
          and (:search is null or lower(r.customerName) like concat('%', :search, '%'))
          and (:status is null or r.status = :status)
          and (:startDate is null or r.date >= :startDate)
          and (:endDate is null or r.date <= :endDate)
        """)
    Page<RevenueRecord> findTableRecordsByUserId(
        @Param("userId") Long userId,
        @Param("search") String search,
        @Param("status") RevenueStatus status,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
}
