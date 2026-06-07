import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { guestbookEntries } from '$lib/server/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { logAction } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/admin/login');

	const pending = await db
		.select()
		.from(guestbookEntries)
		.where(eq(guestbookEntries.approved, false))
		.orderBy(desc(guestbookEntries.createdAt));

	const approved = await db
		.select()
		.from(guestbookEntries)
		.where(eq(guestbookEntries.approved, true))
		.orderBy(desc(guestbookEntries.createdAt));

	return {
		pending,
		approved
	};
};

export const actions: Actions = {
	approve: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.update(guestbookEntries).set({ approved: true }).where(eq(guestbookEntries.id, id));
		await logAction(locals.user.id, 'guestbook.approve', `guestbook:${id}`, {}, getClientAddress());

		return { success: true };
	},

	reject: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.delete(guestbookEntries).where(eq(guestbookEntries.id, id));
		await logAction(locals.user.id, 'guestbook.reject', `guestbook:${id}`, {}, getClientAddress());

		return { success: true };
	},

	delete: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const id = parseInt(data.get('id') as string, 10);
		if (isNaN(id)) return fail(400);

		await db.delete(guestbookEntries).where(eq(guestbookEntries.id, id));
		await logAction(locals.user.id, 'guestbook.delete', `guestbook:${id}`, {}, getClientAddress());

		return { success: true };
	},

	bulk: async ({ request, locals, getClientAddress }) => {
		if (!locals.user) return fail(401);

		const data = await request.formData();
		const ids = (data.get('ids') as string || '').split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
		const bulkAction = data.get('action') as string;

		if (ids.length === 0) return fail(400);

		if (bulkAction === 'approve') {
			await db.update(guestbookEntries).set({ approved: true }).where(inArray(guestbookEntries.id, ids));
			for (const id of ids) {
				await logAction(locals.user.id, 'guestbook.approve', `guestbook:${id}`, { bulk: true }, getClientAddress());
			}
		} else if (bulkAction === 'reject' || bulkAction === 'delete') {
			await db.delete(guestbookEntries).where(inArray(guestbookEntries.id, ids));
			for (const id of ids) {
				await logAction(
					locals.user.id,
					bulkAction === 'reject' ? 'guestbook.reject' : 'guestbook.delete',
					`guestbook:${id}`,
					{ bulk: true },
					getClientAddress()
				);
			}
		}

		return { success: true };
	}
};
