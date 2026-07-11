ALTER TABLE murm_post ADD
(
    post_type           VARCHAR2(20) DEFAULT 'text' NOT NULL,
    photo_day           DATE,
    image_blob          BLOB,
    image_mime_type     VARCHAR2(200),
    image_filename      VARCHAR2(500),

    CONSTRAINT ck_murm_post_type CHECK (post_type IN ('text', 'photo', 'comment')),
    CONSTRAINT ck_murm_post_photo CHECK
    (
        post_type <> 'photo'
        OR
        (
            photo_day IS NOT NULL
            AND image_blob IS NOT NULL
            AND image_mime_type IS NOT NULL
        )
    )
);

CREATE UNIQUE INDEX uk_murm_post_user_photo_day
    ON murm_post
    (
        CASE WHEN post_type = 'photo' THEN user_id END,
        CASE WHEN post_type = 'photo' THEN photo_day END
    );

CREATE INDEX ix_murm_post_type_created
    ON murm_post (post_type, created_at DESC);

CREATE TABLE murm_friend
(
    user_id         NUMBER      NOT NULL,
    friend_user_id  NUMBER      NOT NULL,
    status          CHAR(1)     DEFAULT 'A' NOT NULL,
    created_at      TIMESTAMP   DEFAULT SYSTIMESTAMP NOT NULL,

    CONSTRAINT pk_murm_friend PRIMARY KEY (user_id, friend_user_id),
    CONSTRAINT fk_murm_friend_user FOREIGN KEY (user_id) REFERENCES murm_user(id) ON DELETE CASCADE,
    CONSTRAINT fk_murm_friend_friend FOREIGN KEY (friend_user_id) REFERENCES murm_user(id) ON DELETE CASCADE,
    CONSTRAINT ck_murm_friend_status CHECK (status IN ('P', 'A', 'B')),
    CONSTRAINT ck_murm_friend_distinct CHECK (user_id <> friend_user_id)
);

CREATE INDEX ix_murm_friend_friend
    ON murm_friend (friend_user_id, status);
