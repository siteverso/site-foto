ALTER TABLE murm_user_block ADD block_level VARCHAR2(12) DEFAULT 'all' NOT NULL;

ALTER TABLE murm_user_block ADD CONSTRAINT ck_murm_user_block_level
    CHECK (block_level IN ('all', 'messages'));
