CREATE TABLE retention_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    "month" DATE NOT NULL,
    retained_customers BIGINT NOT NULL,
    churned_customers BIGINT NOT NULL,
    retention_rate NUMERIC(5, 2) NOT NULL,
    CONSTRAINT retention_metrics_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT retention_metrics_month_unique
        UNIQUE (user_id, "month"),
    CONSTRAINT retention_metrics_retained_customers_check
        CHECK (retained_customers >= 0),
    CONSTRAINT retention_metrics_churned_customers_check
        CHECK (churned_customers >= 0),
    CONSTRAINT retention_metrics_rate_check
        CHECK (retention_rate >= 0 AND retention_rate <= 100)
);

CREATE INDEX idx_retention_metrics_user_id ON retention_metrics (user_id);
CREATE INDEX idx_retention_metrics_user_month ON retention_metrics (user_id, "month");
