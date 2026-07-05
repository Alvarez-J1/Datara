CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('USER', 'ADMIN'))
);

CREATE TABLE revenue_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    customer_name VARCHAR(160) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT revenue_records_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT revenue_records_status_check
        CHECK (status IN ('LEAD', 'NEGOTIATION', 'WON', 'LOST'))
);

CREATE INDEX idx_revenue_records_user_id ON revenue_records (user_id);
CREATE INDEX idx_revenue_records_date ON revenue_records (date);
CREATE INDEX idx_revenue_records_status ON revenue_records (status);

CREATE TABLE user_settings (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    theme VARCHAR(32) NOT NULL DEFAULT 'light',
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    dashboard_layout VARCHAR(64) NOT NULL DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_settings_user_fk
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE,
    CONSTRAINT user_settings_theme_check
        CHECK (theme IN ('light', 'dark', 'system'))
);
