import { normalizeProfileBlockType, normalizeProfileVisibility, type ProfileBlockType, type ProfileVisibility } from '../../profile-privacy';
import { withConnection } from '../oracle';

type Row = Record<string, unknown>;
export type ProfilePrivacy = { visibility: ProfileVisibility; deletedAt: string; recoverUntil: string };
export type BlockState = { messages: boolean; profileAccess: boolean; hideMe: boolean; hideThem: boolean };

const EMPTY_BLOCK_STATE: BlockState = { messages: false, profileAccess: false, hideMe: false, hideThem: false };

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
    `UPDATE murm_user SET profile_visibility_code = :visibility, updated_at = SYSTIMESTAMP WHERE id = :id AND active = 1`,
    { visibility, id: userId }, { autoCommit: true }));
}

export async function scheduleProfileRemoval(userId: number): Promise<void> {
  await withConnection(async connection => connection.execute(
    `UPDATE murm_user SET profile_visibility_code = 'deleted', profile_deleted_at = SYSTIMESTAMP, updated_at = SYSTIMESTAMP WHERE id = :id AND active = 1`,
    { id: userId }, { autoCommit: true }));
}

export async function recoverProfile(userId: number): Promise<void> {
  const result = await withConnection(async connection => connection.execute(
    `UPDATE murm_user SET profile_visibility_code = 'public', profile_deleted_at = NULL, updated_at = SYSTIMESTAMP
      WHERE id = :id AND active = 1 AND profile_visibility_code = 'deleted'
        AND profile_deleted_at >= SYSTIMESTAMP - INTERVAL '30' DAY`,
    { id: userId }, { autoCommit: true }));
  if (!Number(result.rowsAffected || 0)) throw new Error('PRAZO_RESGATE_EXPIRADO');
}

export async function getBlockState(ownerUserId: number, targetUserId: number): Promise<BlockState> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT block_messages, block_profile_access, hide_from_target, hide_target
         FROM murm_user_block
        WHERE blocker_user_id = :owner_user_id
          AND blocked_user_id = :target_user_id`,
      { owner_user_id: ownerUserId, target_user_id: targetUserId });
    const row = result.rows?.[0];
    if (!row) return { ...EMPTY_BLOCK_STATE };
    return {
      messages: Number(row.BLOCK_MESSAGES || 0) === 1,
      profileAccess: Number(row.BLOCK_PROFILE_ACCESS || 0) === 1,
      hideMe: Number(row.HIDE_FROM_TARGET || 0) === 1,
      hideThem: Number(row.HIDE_TARGET || 0) === 1,
    };
  });
}

const COLUMN_BY_TYPE: Record<ProfileBlockType, string> = {
  messages: 'block_messages',
  profile_access: 'block_profile_access',
  hide_me: 'hide_from_target',
  hide_them: 'hide_target',
};

export async function setProfileBlock(ownerUserId: number, targetUserId: number, typeValue: unknown, blocked: boolean): Promise<void> {
  if (ownerUserId === targetUserId) throw new Error('BLOQUEIO_INVALIDO');
  const type = normalizeProfileBlockType(typeValue);
  const column = COLUMN_BY_TYPE[type];

  await withConnection(async connection => {
    const targetResult = await connection.execute<Row>(`SELECT id FROM murm_user WHERE id = :target_user_id AND active = 1`, { target_user_id: targetUserId });
    if (!targetResult.rows?.length) throw new Error('USUARIO_ALVO_NAO_ENCONTRADO');

    if (blocked) {
      await connection.execute(
        `MERGE INTO murm_user_block target
         USING (SELECT :owner_user_id blocker_user_id, :target_user_id blocked_user_id FROM dual) source
            ON (target.blocker_user_id = source.blocker_user_id AND target.blocked_user_id = source.blocked_user_id)
          WHEN MATCHED THEN UPDATE SET target.${column} = 1
          WHEN NOT MATCHED THEN INSERT (blocker_user_id, blocked_user_id, ${column})
               VALUES (source.blocker_user_id, source.blocked_user_id, 1)`,
        { owner_user_id: ownerUserId, target_user_id: targetUserId });
    } else {
      await connection.execute(
        `UPDATE murm_user_block SET ${column} = 0
          WHERE blocker_user_id = :owner_user_id AND blocked_user_id = :target_user_id`,
        { owner_user_id: ownerUserId, target_user_id: targetUserId });
      await connection.execute(
        `DELETE FROM murm_user_block
          WHERE blocker_user_id = :owner_user_id AND blocked_user_id = :target_user_id
            AND block_messages = 0 AND block_profile_access = 0 AND hide_from_target = 0 AND hide_target = 0`,
        { owner_user_id: ownerUserId, target_user_id: targetUserId });
    }

    if (blocked && (type === 'profile_access' || type === 'hide_me' || type === 'hide_them')) {
      await connection.execute(
        `DELETE FROM murm_friend
          WHERE (user_id = :owner_user_id AND friend_user_id = :target_user_id)
             OR (user_id = :target_user_id AND friend_user_id = :owner_user_id)`,
        { owner_user_id: ownerUserId, target_user_id: targetUserId });
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
           WHERE (b.blocker_user_id = :target_user_id AND b.blocked_user_id = :viewer_user_id AND b.hide_from_target = 1)
              OR (b.blocker_user_id = :viewer_user_id AND b.blocked_user_id = :target_user_id AND b.hide_target = 1)
        ) THEN 0 ELSE 1 END AS allowed FROM dual`,
      { viewer_user_id: viewerUserId, target_user_id: targetUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}

export async function canAccessProfile(ownerUserId: number, viewerUserId: number): Promise<boolean> {
  if (ownerUserId === viewerUserId) return true;
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT CASE WHEN u.profile_visibility_code IN ('private','deleted') OR EXISTS (
          SELECT 1 FROM murm_user_block b
           WHERE (b.blocker_user_id = u.id AND b.blocked_user_id = :viewer_user_id AND (b.block_profile_access = 1 OR b.hide_from_target = 1))
              OR (b.blocker_user_id = :viewer_user_id AND b.blocked_user_id = u.id AND b.hide_target = 1)
        ) THEN 0 ELSE 1 END AS allowed
         FROM murm_user u WHERE u.id = :owner_user_id AND u.active = 1`,
      { owner_user_id: ownerUserId, viewer_user_id: viewerUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}

export async function canExchangeMessages(userId: number, otherUserId: number): Promise<boolean> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT CASE WHEN EXISTS (
          SELECT 1 FROM murm_user_block b
           WHERE b.block_messages = 1
             AND ((b.blocker_user_id = :user_id AND b.blocked_user_id = :other_user_id)
               OR (b.blocker_user_id = :other_user_id AND b.blocked_user_id = :user_id))
        ) THEN 0 ELSE 1 END AS allowed FROM dual`,
      { user_id: userId, other_user_id: otherUserId });
    return Number(result.rows?.[0]?.ALLOWED || 0) === 1;
  });
}

export type BlockedUser = {
  id: number;
  username: string;
  avatarUrl: string;
  types: ProfileBlockType[];
};

export async function listBlockedUsers(ownerUserId: number): Promise<BlockedUser[]> {
  return withConnection(async connection => {
    const result = await connection.execute<Row>(
      `SELECT u.id, u.username,
              b.block_messages, b.block_profile_access, b.hide_from_target, b.hide_target
         FROM murm_user_block b
         JOIN murm_user u ON u.id = b.blocked_user_id
        WHERE b.blocker_user_id = :owner_user_id
          AND (b.block_messages = 1 OR b.block_profile_access = 1 OR b.hide_from_target = 1 OR b.hide_target = 1)
        ORDER BY LOWER(u.username)`,
      { owner_user_id: ownerUserId });

    return (result.rows || []).map(row => {
      const types: ProfileBlockType[] = [];
      if (Number(row.BLOCK_MESSAGES || 0) === 1) types.push('messages');
      if (Number(row.BLOCK_PROFILE_ACCESS || 0) === 1) types.push('profile_access');
      if (Number(row.HIDE_FROM_TARGET || 0) === 1) types.push('hide_me');
      if (Number(row.HIDE_TARGET || 0) === 1) types.push('hide_them');
      const id = Number(row.ID);
      return { id, username: String(row.USERNAME || ''), avatarUrl: `/api/users/${id}/avatar`, types };
    });
  });
}
