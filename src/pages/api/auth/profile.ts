import type { APIRoute } from 'astro';
import { body, errorResponse, json } from '../../../lib/server/http';
import { requireUser } from '../../../lib/server/session';
import { getAccountProfile, updateAccountProfile } from '../../../lib/server/repositories/account-profile';

type RouteContext = Parameters<APIRoute>[0];

export async function GET(context: RouteContext) {
    try {
        const user = await requireUser(context);
        return json({ ok: true, account: await getAccountProfile(user.id) });
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PATCH(context: RouteContext) {
    try {
        const user = await requireUser(context);
        const input = await body<{
            username?: unknown;
            email?: unknown;
            bio?: unknown;
            sexCode?: unknown;
            observerVisibility?: unknown;
            hiddenObservedUserIds?: unknown;
        }>(context.request);
        await updateAccountProfile(user.id, input);
        return json({ ok: true, account: await getAccountProfile(user.id) });
    } catch (error) {
        return errorResponse(error);
    }
}
