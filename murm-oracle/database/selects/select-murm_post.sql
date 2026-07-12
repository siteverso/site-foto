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