ALTER TABLE murm_user ADD profile_visibility_code VARCHAR2(12) DEFAULT 'public' NOT NULL;
ALTER TABLE murm_user ADD profile_deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE murm_user ADD CONSTRAINT ck_murm_user_profile_visibility CHECK (profile_visibility_code IN ('public', 'unlisted', 'private', 'deleted'));

CREATE TABLE murm_user_block
(
    owner_user_id   NUMBER NOT NULL,
    blocked_user_id NUMBER NOT NULL,
    block_level     VARCHAR2(12) NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_murm_user_block PRIMARY KEY (owner_user_id, blocked_user_id, block_level),
    CONSTRAINT fk_murm_user_block_owner FOREIGN KEY (owner_user_id) REFERENCES murm_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_murm_user_block_target FOREIGN KEY (blocked_user_id) REFERENCES murm_user(id) ON DELETE CASCADE,
    CONSTRAINT ck_murm_user_block_level CHECK (block_level IN ('all', 'messages')),
    CONSTRAINT ck_murm_user_block_distinct CHECK (owner_user_id <> blocked_user_id)
);

CREATE INDEX ix_murm_user_block_target ON murm_user_block (blocked_user_id, owner_user_id, block_level);
