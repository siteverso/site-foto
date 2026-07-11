BEGIN
    EXECUTE IMMEDIATE 'DROP INDEX uk_murm_post_user_photo_day';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE <> -1418 THEN
            RAISE;
        END IF;
END;
/
