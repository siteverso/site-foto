ALTER TABLE murm_user_block
    DROP CONSTRAINT ck_murm_user_block_level
/

ALTER TABLE murm_user_block
    ADD CONSTRAINT ck_murm_user_block_level
        CHECK (block_level IN ('messages', 'profile', 'all'))
/
