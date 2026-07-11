ALTER TABLE murm_user
    ADD observer_visibility_code VARCHAR2(10) DEFAULT 'public' NOT NULL;

ALTER TABLE murm_user
    ADD CONSTRAINT ck_murm_user_observer_visibility
        CHECK (observer_visibility_code IN ('public', 'private'));
