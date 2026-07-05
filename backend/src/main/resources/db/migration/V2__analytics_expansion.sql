CREATE TABLE customer_segments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    segment_name VARCHAR(120) NOT NULL,
    customer_count BIGINT NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT customer_segments_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT customer_segments_customer_count_check
        CHECK (customer_count >= 0),
    CONSTRAINT customer_segments_revenue_check
        CHECK (revenue >= 0)
);

CREATE INDEX idx_customer_segments_user_id ON customer_segments (user_id);
CREATE INDEX idx_customer_segments_user_segment_name
    ON customer_segments (user_id, segment_name);

CREATE TABLE acquisition_sources (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    source_name VARCHAR(120) NOT NULL,
    percentage NUMERIC(5, 2) NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    CONSTRAINT acquisition_sources_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT acquisition_sources_percentage_check
        CHECK (percentage >= 0 AND percentage <= 100),
    CONSTRAINT acquisition_sources_revenue_check
        CHECK (revenue >= 0)
);

CREATE INDEX idx_acquisition_sources_user_id ON acquisition_sources (user_id);
CREATE INDEX idx_acquisition_sources_user_source_name
    ON acquisition_sources (user_id, source_name);

CREATE TABLE product_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_name VARCHAR(160) NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    units_sold BIGINT NOT NULL,
    CONSTRAINT product_metrics_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT product_metrics_revenue_check
        CHECK (revenue >= 0),
    CONSTRAINT product_metrics_units_sold_check
        CHECK (units_sold >= 0)
);

CREATE INDEX idx_product_metrics_user_id ON product_metrics (user_id);
CREATE INDEX idx_product_metrics_user_product_name
    ON product_metrics (user_id, product_name);

CREATE TABLE region_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    region_name VARCHAR(120) NOT NULL,
    revenue NUMERIC(14, 2) NOT NULL,
    growth_rate NUMERIC(7, 2) NOT NULL,
    CONSTRAINT region_metrics_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT region_metrics_revenue_check
        CHECK (revenue >= 0)
);

CREATE INDEX idx_region_metrics_user_id ON region_metrics (user_id);
CREATE INDEX idx_region_metrics_user_region_name
    ON region_metrics (user_id, region_name);

CREATE TABLE dashboard_forecasts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    "month" DATE NOT NULL,
    predicted_revenue NUMERIC(14, 2) NOT NULL,
    actual_revenue NUMERIC(14, 2),
    CONSTRAINT dashboard_forecasts_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT dashboard_forecasts_predicted_revenue_check
        CHECK (predicted_revenue >= 0),
    CONSTRAINT dashboard_forecasts_actual_revenue_check
        CHECK (actual_revenue IS NULL OR actual_revenue >= 0)
);

CREATE INDEX idx_dashboard_forecasts_user_id ON dashboard_forecasts (user_id);
CREATE INDEX idx_dashboard_forecasts_user_month ON dashboard_forecasts (user_id, "month");
