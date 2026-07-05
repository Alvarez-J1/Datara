package com.datara.settings;

import com.datara.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_settings")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // Dashboard settings
    @Enumerated(EnumType.STRING)
    @Column(name = "default_time_range", nullable = false, length = 32)
    private DefaultTimeRange defaultTimeRange;

    @Column(name = "table_page_size", nullable = false)
    private int tablePageSize;

    @Column(name = "compact_mode", nullable = false)
    private boolean compactMode;

    // Notifications
    @Column(name = "weekly_report", nullable = false)
    private boolean weeklyReport;

    @Column(name = "email_digest", nullable = false)
    private boolean emailDigest;

    @Column(name = "anomaly_alerts", nullable = false)
    private boolean anomalyAlerts;

    // Appearance
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private Theme theme;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (theme == null) {
            theme = Theme.SYSTEM;
        }
        if (defaultTimeRange == null) {
            defaultTimeRange = DefaultTimeRange.LAST_12_MONTHS;
        }
        if (tablePageSize == 0) {
            tablePageSize = 25;
        }
    }
}
