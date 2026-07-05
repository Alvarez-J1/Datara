package com.datara.analytics.model;

import com.datara.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "region_metrics",
    indexes = {
        @Index(name = "idx_region_metrics_user_id", columnList = "user_id"),
        @Index(
            name = "idx_region_metrics_user_region_name",
            columnList = "user_id, region_name"
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "region_name", nullable = false, length = 120)
    private String regionName;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal revenue;

    @Column(name = "growth_rate", nullable = false, precision = 7, scale = 2)
    private BigDecimal growthRate;
}
