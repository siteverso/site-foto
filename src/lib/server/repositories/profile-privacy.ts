import { normalizeProfileBlockLevel, normalizeProfileVisibility, type ProfileBlockLevel, type ProfileVisibility } from '../../profile-privacy';
import { withConnection } from '../oracle';

type Row = Record<string, unknown>;
export type ProfilePrivacy = { visibility: ProfileVisibility; deletedAt: string; recoverUntil: string };
export type BlockState = { all: boolean; profile: boolean; messages: boolean };

export async function getProfilePrivacy(userId: number): Promise<ProfilePrivacy> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT NVL(profile_visibility_code, 'public') AS profile_visibility_code,
              TO_CHAR(profile_deleted_at, 'YYYY-MM-DD"T"HH24:MI:SS') AS profile_deleted_at,
              TO_CHAR(profile_deleted_at + INTERVAL '30' DAY, 'YYYY-MM-DD"T"HH24:MI:SS') AS recover_until
         FROM murm_user
        WHERE id = :id`, { id: userId });
    const row = result.rows?.[0] || {};
    return { visibility: normalizeProfileVisibility(row.PROFILE_VISIBILITY_CODE), deletedAt: String(row.PROFILE_DELETED_AT || ''), recoverUntil: String(row.RECOVER_UNTIL || '') };
  });
}

export async function setProfileVisibility(userId: number, visibilityValue: unknown): Promise<void> {
  const visibility = normalizeProfileVisibility(visibilityValue);
  if (visibility === 'deleted') throw new Error('VISIBILIDADE_INVALIDA');
  await withConnection(async connection => connection.execute(
    `UPDATE murm_user
        SET profile_visibility_code = :visibility,
            updated_at = SYSTIMESTAMP
      WHERE id = :id AND active = 1`, { visibility, id: userId }, { autoCommit: true }));
}

export async function scheduleProfileRemoval(userId: number): Promise<void> {
  await withConnection(async connection => connection.execute(
    `UPDATE murm_user
        SET profile_visibility_code = 'deleted',
            profile_deleted_at = SYSTIMESTAMP,
            updated_at = SYSTIMESTAMP
      WHERE id = :id AND active = 1`, { id: userId }, { autoCommit: true }));
}

export async function recoverProfile(userId: number): Promise<void> {
  const result = await withConnection(async connection => connection.execute(
    `UPDATE murm_user
        SET profile_visibility_code = 'public',
            profile_deleted_at = NULL,
            updated_at = SYSTIMESTAMP
      WHERE id = :id
        AND active = 1
        AND profile_visibility_code = 'deleted'
        AND profile_deleted_at >= SYSTIMESTAMP - INTERVAL '30' DAY`, { id: userId }, { autoCommit: true }));
  if (!Number(result.rowsAffected || 0)) throw new Error('PRAZO_RESGATE_EXPIRADO');
}

export async function getBlockState(ownerUserId: number, targetUserId: number): Promise<BlockState> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT block_level FROM murm_user_block
        WHERE blocker_user_id = :owner AND blocked_user_id = :target`, { owner: ownerUserId, target: targetUserId });
    const levels = new Set((result.rows || []).map(row => String(row.BLOCK_LEVEL)));
    return {
      all: levels.has('all'),
      profile: levels.has('all') || levels.has('profile'),
      messages: levels.has('all') || levels.has('profile') || levels.has('messages'),
    };
  });
}

export async function setProfileBlock(ownerUserId: number, targetUserId: number, levelValue: unknown, blocked: boolean): Promise<void> {
  if (ownerUserId === targetUserId) throw new Error('BLOQUEIO_INVALIDO');
  const level = normalizeProfileBlockLevel(levelValue);
  await withConnection(async connection => {
    const targetResult = await connection.execute<Row>(
      `SELECT id FROM murm_user WHERE id = :target AND active = 1`,
      { target: targetUserId });
    if (!targetResult.rows?.length) throw new Error('USUARIO_ALVO_NAO_ENCONTRADO');

    if (blocked) {
      await connection.execute(
        `MERGE INTO murm_user_block target
         USING (SELECT :owner blocker_user_id, :blocked blocked_user_id, :blockLevel block_level FROM dual) source
            ON (target.blocker_user_id = source.blocker_user_id AND target.blocked_user_id = source.blocked_user_id)
          WHEN MATCHED THEN UPDATE
               SET target.block_level = CASE
                   WHEN source.block_level = 'all' THEN 'all'
                   WHEN source.block_level = 'profile' THEN 'profile'
                   ELSE 'messages'
               END
          WHEN NOT MATCHED THEN INSERT (blocker_user_id, blocked_user_id, block_level)
               VALUES (source.blocker_user_id, source.blocked_user_id, source.block_level)`,
        { owner: ownerUserId, blocked: targetUserId, blockLevel: level });
      if (level === 'all' || level === 'profile') {
        await connection.execute(
          `DELETE FROM murm_friend
            WHERE (user_id = :owner AND friend_user_id = :blocked)
               OR (user_id = :blocked AND friend_user_id = :owner)`,
          { owner: ownerUserId, blocked: targetUserId });
      }
    } else {
      await connection.execute(
        `DELETE FROM murm_user_block
          WHERE blocker_user_id = :owner
            AND blocked_user_id = :blocked
            AND NVL(LOWER(TRIM(block_level)), 'all') = :blockLevel`,
        { owner: ownerUserId, blocked: targetUserId, blockLevel: level });
    }
    await connection.commit();
  });
}

export async function canSeeUserAnywhere(viewerUserId: number, targetUserId: number): Promise<boolean> {
  if (viewerUserId === targetUserId) return true;
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT CASE WHEN EXISTS (
          SELECT 1 FROM murm_user_block b
           WHERE NVL(LOWER(TRIM(b.block_level)), 'all') = 'all'
             AND ((b.blocker_user_id = :viewer_id AND b.blocked_user_id = :target_id)
               OR (b.blocker_user_id = :target_id AND b.blocked_user_id = :viewer_id))
        ) THEN 0 ELSE 1 END AS allowed FROM dual`,
      { viewer_id: viewerUserId, target_id: targetUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}


export async function canAccessProfile(ownerUserId: number, viewerUserId: number): Promise<boolean> {
  if (ownerUserId === viewerUserId) return true;
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT CASE WHEN u.profile_visibility_code IN ('private','deleted')
                        OR EXISTS (
                             SELECT 1
                               FROM murm_user_block b
                              WHERE NVL(LOWER(TRIM(b.block_level)), 'all') IN ('profile', 'all')
                                AND b.blocker_user_id = u.id
                                AND b.blocked_user_id = :viewer
                           )
                   THEN 0 ELSE 1 END AS allowed
         FROM murm_user u
        WHERE u.id = :owner
          AND u.active = 1`,
      { owner: ownerUserId, viewer: viewerUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}

export async function canExchangeMessages(userId: number, otherUserId: number): Promise<boolean> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT CASE WHEN EXISTS (
          SELECT 1 FROM murm_user_block b
           WHERE NVL(LOWER(TRIM(b.block_level)), 'all') IN ('all','profile','messages')
             AND ((b.blocker_user_id = :user_id AND b.blocked_user_id = :other_id)
               OR (b.blocker_user_id = :other_id AND b.blocked_user_id = :user_id))
        ) THEN 0 ELSE 1 END AS allowed FROM dual`, { user_id: userId, other_id: otherUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}

export type BlockedUser = {
  id: number;
  username: string;
  avatarUrl: string;
  level: ProfileBlockLevel;
  blocksProfile: boolean;
  blocksMessages: boolean;
};

export async function listBlockedUsers(ownerUserId: number): Promise<BlockedUser[]> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT u.id,
              u.username,
              NVL(LOWER(TRIM(b.block_level)), 'all') AS block_level
         FROM murm_user_block b
         JOIN murm_user u
           ON u.id = b.blocked_user_id
        WHERE b.blocker_user_id = :owner_user_id
        ORDER BY CASE NVL(LOWER(TRIM(b.block_level)), 'all') WHEN 'all' THEN 0 WHEN 'profile' THEN 1 ELSE 2 END,
                 LOWER(u.username)`,
      { owner_user_id: ownerUserId });

    return (result.rows || []).map(row => {
      const level = normalizeProfileBlockLevel(row.BLOCK_LEVEL);
      const id = Number(row.ID);
      return {
        id,
        username: String(row.USERNAME || ''),
        avatarUrl: `/api/users/${id}/avatar`,
        level,
        blocksProfile: level === 'all' || level === 'profile',
        blocksMessages: true,
      };
    });
  });
}
