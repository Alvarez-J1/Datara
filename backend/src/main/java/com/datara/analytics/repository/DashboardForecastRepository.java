package com.datara.analytics.repository;

import com.datara.analytics.model.DashboardForecast;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DashboardForecastRepository extends JpaRepository<DashboardForecast, Long> {

    @Query("""
        select d
        from DashboardForecast d
        where d.user.id = :userId
        order by d.month, d.id
        """)
    List<DashboardForecast> findByUserId(@Param("userId") Long userId);
}
