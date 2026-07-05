package com.datara.analytics.repository;

import com.datara.analytics.model.AcquisitionSource;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AcquisitionSourceRepository extends JpaRepository<AcquisitionSource, Long> {

    @Query("""
        select a
        from AcquisitionSource a
        where a.user.id = :userId
        order by lower(a.sourceName), a.id
        """)
    List<AcquisitionSource> findByUserId(@Param("userId") Long userId);
}
