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
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "retention_metrics",
    indexes = {
        @Index(name = "idx_retention_metrics_user_id", columnList = "user_id"),
        @Index(name = "idx_retention_metrics_user_month", columnList = "user_id, \"month\"")
    },
    uniqueConstraints = {
        @UniqueConstraint(
            name = "retention_metrics_month_unique",
            columnNames = {"user_id", "\"month\""}
        )
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetentionMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "retained_customers", nullable = false)
    private Long retainedCustomers;

    @Column(name = "churned_customers", nullable = false)
    private Long churnedCustomers;

    @Column(name = "retention_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal retentionRate;
}
