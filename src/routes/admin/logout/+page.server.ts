import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { clearSessionCookie, invalidateSession } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ locals, cookies }) => {
		if (locals.session) await invalidateSession(locals.session.id);
		clearSessionCookie(cookies);
		throw redirect(302, '/admin/login');
	}
};
