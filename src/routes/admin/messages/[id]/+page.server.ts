import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactMessages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';

export const load: PageServerLoad = async ({ params, locals, getClientAddress }) => {
	if (!locals.user) throw redirect(302, '/admin/login');

	const id = parseInt(params.id, 10);
	if (isNaN(id)) throw error(400, 'Invalid ID');

	const [message] = await db.select().from(contactMessages).where(eq(contactMessages.id, id));
	if (!message) throw error(404, 'Message not found');

	// Auto-mark as read if loading the detail view
	if (!message.read) {
		await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.read', `message:${id}`, { auto: true }, getClientAddress());
		message.read = true;
	}

	return { message };
};

export const actions: Actions = {
	archive: async ({ params, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);
		
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400);

		await db.update(contactMessages).set({ archived: true }).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.archive', `message:${id}`, {}, getClientAddress());

		throw redirect(302, '/admin/messages');
	},

	delete: async ({ params, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);
		
		const id = parseInt(params.id, 10);
		if (isNaN(id)) return fail(400);

		await db.delete(contactMessages).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.delete', `message:${id}`, {}, getClientAddress());

		throw redirect(302, '/admin/messages');
	}
};
