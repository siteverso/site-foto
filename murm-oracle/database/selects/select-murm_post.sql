select *
from murm_post
order by id desc
;

select distinct post_type
from murm_post
;


UPDATE murm_user
   SET password_hash = '$2b$12$lyWWL6rcX9267HwZvM.GCuUGp3Gib5RNAEkp189AN7dd0USObqyay',
       updated_at = SYSTIMESTAMP
 WHERE LOWER(username) = 'machine';

COMMIT;



SELECT b.blocker_user_id,
       blocker.username AS blocker_username,
       b.blocked_user_id,
       blocked.username AS blocked_username,
       b.block_level,
       b.created_at
  FROM murm_user_block b
  JOIN murm_user blocker
    ON blocker.id = b.blocker_user_id
  JOIN murm_user blocked
    ON blocked.id = b.blocked_user_id
 ORDER BY b.created_at DESC;
