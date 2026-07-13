import type { APIRoute } from 'astro';
import { errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { listBlockedUsers } from '../../../lib/server/repositories/profile-privacy';

export const GET: APIRoute = async context => {
  try {
    const user = await requireUser(context);
    return json({ ok: true, users: await listBlockedUsers(user.id) });
  } catch (error) {
    return errorResponse(error);
  }
};
