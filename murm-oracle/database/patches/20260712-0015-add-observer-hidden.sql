CREATE TABLE murm_observer_hidden
(
    owner_user_id  NUMBER NOT NULL,
    hidden_user_id NUMBER NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_murm_observer_hidden PRIMARY KEY (owner_user_id, hidden_user_id),
    CONSTRAINT fk_murm_observer_hidden_owner FOREIGN KEY (owner_user_id)
        REFERENCES murm_user (id) ON DELETE CASCADE,
    CONSTRAINT fk_murm_observer_hidden_user FOREIGN KEY (hidden_user_id)
        REFERENCES murm_user (id) ON DELETE CASCADE,
    CONSTRAINT ck_murm_observer_hidden_self CHECK (owner_user_id <> hidden_user_id)
);

CREATE INDEX ix_murm_observer_hidden_user
    ON murm_observer_hidden (hidden_user_id);
