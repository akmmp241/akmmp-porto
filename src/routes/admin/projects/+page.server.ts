import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { deleteProjectImage } from '$lib/server/upload';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select()
		.from(projects)
		.orderBy(asc(projects.order), asc(projects.id));
	return { projects: rows };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		const [row] = await db.select().from(projects).where(eq(projects.id, id));
		if (row) {
			await deleteProjectImage(row.image);
			await db.delete(projects).where(eq(projects.id, id));
		}
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
				await tx.update(projects).set({ order: i }).where(eq(projects.id, ids[i]));
			}
		});
		return { ok: true };
	},
	toggleFeatured: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const value = fd.get('value') === 'true';
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		await db
			.update(projects)
			.set({ featured: value, updatedAt: new Date() })
			.where(eq(projects.id, id));
		return { ok: true };
	}
};
