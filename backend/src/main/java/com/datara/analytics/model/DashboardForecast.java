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
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "dashboard_forecasts",
    indexes = {
        @Index(name = "idx_dashboard_forecasts_user_id", columnList = "user_id"),
        @Index(name = "idx_dashboard_forecasts_user_month", columnList = "user_id, \"month\"")
    }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "predicted_revenue", nullable = false, precision = 14, scale = 2)
    private BigDecimal predictedRevenue;

    @Column(name = "actual_revenue", precision = 14, scale = 2)
    private BigDecimal actualRevenue;
}
