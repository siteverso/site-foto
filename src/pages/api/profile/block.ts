import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { getBlockState, setProfileBlock } from '../../../lib/server/repositories/profile-privacy';
type Ctx = Parameters<APIRoute>[0];
export async function GET(context: Ctx) { try { const user = await requireUser(context); const target = Number(new URL(context.request.url).searchParams.get('userId')); return json({ ok: true, block: await getBlockState(user.id, target) }); } catch (e) { return errorResponse(e); } }
export async function PATCH(context: Ctx) { try { const user = await requireUser(context); const input = await body<{ userId?: unknown; level?: unknown; blocked?: unknown }>(context.request); const target = Number(input.userId); await setProfileBlock(user.id, target, input.level, Boolean(input.blocked)); return json({ ok: true, block: await getBlockState(user.id, target) }); } catch (e) { return errorResponse(e); } }
