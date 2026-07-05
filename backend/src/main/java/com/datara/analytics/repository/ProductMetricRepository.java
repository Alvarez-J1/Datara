package com.datara.analytics.repository;

import com.datara.analytics.model.ProductMetric;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductMetricRepository extends JpaRepository<ProductMetric, Long> {

    @Query("""
        select p
        from ProductMetric p
        where p.user.id = :userId
        order by lower(p.productName), p.id
        """)
    List<ProductMetric> findByUserId(@Param("userId") Long userId);
}
