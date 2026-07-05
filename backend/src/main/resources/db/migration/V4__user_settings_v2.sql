-- Re-scope user_settings from a placeholder model into real, persisted SaaS
-- preferences: dashboard defaults, notification toggles, and appearance.

ALTER TABLE user_settings DROP CONSTRAINT user_settings_theme_check;

UPDATE user_settings SET theme = UPPER(theme);

ALTER TABLE user_settings ALTER COLUMN theme SET DEFAULT 'SYSTEM';

ALTER TABLE user_settings ADD CONSTRAINT user_settings_theme_check
    CHECK (theme IN ('LIGHT', 'DARK', 'SYSTEM'));

ALTER TABLE user_settings ADD COLUMN default_time_range VARCHAR(32) NOT NULL DEFAULT 'LAST_12_MONTHS';

ALTER TABLE user_settings ADD CONSTRAINT user_settings_default_time_range_check
    CHECK (default_time_range IN ('LAST_30_DAYS', 'LAST_90_DAYS', 'LAST_12_MONTHS'));

ALTER TABLE user_settings ADD COLUMN table_page_size INTEGER NOT NULL DEFAULT 25;

ALTER TABLE user_settings ADD CONSTRAINT user_settings_table_page_size_check
    CHECK (table_page_size IN (25, 50, 100));

ALTER TABLE user_settings ADD COLUMN compact_mode BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE user_settings ADD COLUMN weekly_report BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE user_settings ADD COLUMN email_digest BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE user_settings ADD COLUMN anomaly_alerts BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE user_settings DROP COLUMN notifications_enabled;

ALTER TABLE user_settings DROP COLUMN dashboard_layout;
