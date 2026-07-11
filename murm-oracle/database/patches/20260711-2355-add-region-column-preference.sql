ALTER TABLE murm_user ADD (
    region_code      VARCHAR2(2),
    column_group_mode VARCHAR2(10) DEFAULT 'SEX' NOT NULL
);

ALTER TABLE murm_user ADD CONSTRAINT ck_murm_user_region
    CHECK (region_code IS NULL OR region_code IN ('N', 'NE', 'CO', 'SE', 'S'));

ALTER TABLE murm_user ADD CONSTRAINT ck_murm_user_column_group
    CHECK (column_group_mode IN ('SEX', 'REGION'));

CREATE INDEX ix_murm_user_region ON murm_user (region_code);
