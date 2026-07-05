package com.datara.analytics.repository;

import com.datara.analytics.model.CustomerSegment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CustomerSegmentRepository extends JpaRepository<CustomerSegment, Long> {

    @Query("""
        select c
        from CustomerSegment c
        where c.user.id = :userId
        order by lower(c.segmentName), c.id
        """)
    List<CustomerSegment> findByUserId(@Param("userId") Long userId);
}
