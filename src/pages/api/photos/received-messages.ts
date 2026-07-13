import type { APIRoute } from 'astro';
import { errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { getReceivedPhotoMessages } from '../../../lib/server/repositories/received-photo-messages';

export const GET: APIRoute = async context => {
  try {
    const user = await requireUser(context);
    const items = await getReceivedPhotoMessages(user.id, 8);
    return json({
      ok: true,
      latestId: items[0]?.id || 0,
      items,
    });
  } catch (error) {
    return errorResponse(error);
  }
};
