package com.datara.analytics.repository;

import com.datara.analytics.model.RetentionMetric;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RetentionMetricRepository extends JpaRepository<RetentionMetric, Long> {

    @Query("""
        select r
        from RetentionMetric r
        where r.user.id = :userId
        order by r.month, r.id
        """)
    List<RetentionMetric> findByUserId(@Param("userId") Long userId);
}
