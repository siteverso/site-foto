import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { getProfilePrivacy, recoverProfile, scheduleProfileRemoval, setProfileVisibility } from '../../../lib/server/repositories/profile-privacy';

type Ctx = Parameters<APIRoute>[0];
export async function GET(context: Ctx) { try { const user = await requireUser(context); return json({ ok: true, privacy: await getProfilePrivacy(user.id) }); } catch (e) { return errorResponse(e); } }
export async function PATCH(context: Ctx) { try { const user = await requireUser(context); const input = await body<{ action?: unknown; visibility?: unknown }>(context.request); const action = String(input.action || 'visibility'); if (action === 'remove') await scheduleProfileRemoval(user.id); else if (action === 'recover') await recoverProfile(user.id); else await setProfileVisibility(user.id, input.visibility); return json({ ok: true, privacy: await getProfilePrivacy(user.id) }); } catch (e) { return errorResponse(e); } }
