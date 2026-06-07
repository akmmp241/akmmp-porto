import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactMessages } from '$lib/server/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!locals.user) throw redirect(302, '/admin/login');

	const tab = url.searchParams.get('tab') || 'unread';
	
	let filterCondition = undefined;
	if (tab === 'unread') {
		filterCondition = eq(contactMessages.read, false);
	} else if (tab === 'archived') {
		filterCondition = eq(contactMessages.archived, true);
	} else {
		// All non-archived messages
		filterCondition = eq(contactMessages.archived, false);
	}

	const messages = await db
		.select()
		.from(contactMessages)
		.where(filterCondition)
		.orderBy(desc(contactMessages.createdAt));

	return {
		messages,
		tab
	};
};

export const actions: Actions = {
	markRead: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);
		
		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.read', `message:${id}`, {}, getClientAddress());

		return { success: true };
	},

	archive: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);
		
		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.update(contactMessages).set({ archived: true }).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.archive', `message:${id}`, {}, getClientAddress());

		return { success: true };
	},

	delete: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);
		
		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.delete(contactMessages).where(eq(contactMessages.id, id));
		await logAction(locals.user.id, 'message.delete', `message:${id}`, {}, getClientAddress());

		return { success: true };
	},

	bulk: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const ids = (data.get('ids') as string || '').split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
		const bulkAction = data.get('action') as string;

		if (ids.length === 0) return fail(400);

		if (bulkAction === 'read') {
			await db.update(contactMessages).set({ read: true }).where(inArray(contactMessages.id, ids));
			for (const id of ids) {
				await logAction(locals.user.id, 'message.read', `message:${id}`, { bulk: true }, getClientAddress());
			}
		} else if (bulkAction === 'archive') {
			await db.update(contactMessages).set({ archived: true }).where(inArray(contactMessages.id, ids));
			for (const id of ids) {
				await logAction(locals.user.id, 'message.archive', `message:${id}`, { bulk: true }, getClientAddress());
			}
		} else if (bulkAction === 'delete') {
			await db.delete(contactMessages).where(inArray(contactMessages.id, ids));
			for (const id of ids) {
				await logAction(locals.user.id, 'message.delete', `message:${id}`, { bulk: true }, getClientAddress());
			}
		}

		return { success: true };
	}
};
