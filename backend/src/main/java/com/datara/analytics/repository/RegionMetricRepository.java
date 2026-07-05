package com.datara.analytics.repository;

import com.datara.analytics.model.RegionMetric;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegionMetricRepository extends JpaRepository<RegionMetric, Long> {

    @Query("""
        select r
        from RegionMetric r
        where r.user.id = :userId
        order by lower(r.regionName), r.id
        """)
    List<RegionMetric> findByUserId(@Param("userId") Long userId);
}
