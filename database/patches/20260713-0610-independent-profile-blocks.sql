ALTER TABLE murm_user_block ADD block_messages NUMBER(1) DEFAULT 0 NOT NULL;
ALTER TABLE murm_user_block ADD block_profile_access NUMBER(1) DEFAULT 0 NOT NULL;
ALTER TABLE murm_user_block ADD hide_from_target NUMBER(1) DEFAULT 0 NOT NULL;
ALTER TABLE murm_user_block ADD hide_target NUMBER(1) DEFAULT 0 NOT NULL;

ALTER TABLE murm_user_block ADD CONSTRAINT ck_murm_user_block_messages CHECK (block_messages IN (0, 1));
ALTER TABLE murm_user_block ADD CONSTRAINT ck_murm_user_block_profile CHECK (block_profile_access IN (0, 1));
ALTER TABLE murm_user_block ADD CONSTRAINT ck_murm_user_block_hide_from CHECK (hide_from_target IN (0, 1));
ALTER TABLE murm_user_block ADD CONSTRAINT ck_murm_user_block_hide_target CHECK (hide_target IN (0, 1));

UPDATE murm_user_block
   SET block_messages = CASE WHEN NVL(LOWER(TRIM(block_level)), 'all') IN ('messages', 'profile', 'all') THEN 1 ELSE 0 END,
       block_profile_access = CASE WHEN NVL(LOWER(TRIM(block_level)), 'all') IN ('profile', 'all') THEN 1 ELSE 0 END,
       hide_from_target = CASE WHEN NVL(LOWER(TRIM(block_level)), 'all') = 'all' THEN 1 ELSE 0 END,
       hide_target = CASE WHEN NVL(LOWER(TRIM(block_level)), 'all') = 'all' THEN 1 ELSE 0 END where 1=1;
