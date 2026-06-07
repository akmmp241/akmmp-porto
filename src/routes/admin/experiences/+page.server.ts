import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { experiences } from '$lib/server/db/schema';
import { asc, eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select()
		.from(experiences)
		.orderBy(asc(experiences.order), asc(experiences.id));
	return { experiences: rows };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		await db.delete(experiences).where(eq(experiences.id, id));
		return { ok: true };
	},
	reorder: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const raw = fd.get('ids');
		if (typeof raw !== 'string') return fail(400, { error: 'Missing ids' });
		let ids: number[] = [];
		try {
			ids = JSON.parse(raw);
		} catch {
			return fail(400, { error: 'Invalid ids' });
		}
		if (!Array.isArray(ids) || ids.some((v) => !Number.isInteger(v))) {
			return fail(400, { error: 'Invalid ids' });
		}
		await db.transaction(async (tx) => {
			for (let i = 0; i < ids.length; i++) {
				await tx.update(experiences).set({ order: i }).where(eq(experiences.id, ids[i]));
			}
		});
		return { ok: true };
	}
};
