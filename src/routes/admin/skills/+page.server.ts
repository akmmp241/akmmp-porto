import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { skillGroups } from '$lib/server/db/schema';
import { asc, count, eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { skillGroupFormSchema } from '$lib/schemas/admin';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select()
		.from(skillGroups)
		.orderBy(asc(skillGroups.order), asc(skillGroups.id));
	const newForm = await superValidate(zod(skillGroupFormSchema));
	return { groups: rows, newForm };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const form = await superValidate(request, zod(skillGroupFormSchema));
		if (!form.valid) return fail(400, { newForm: form });
		const items = form.data.items
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		const [{ next }] = await db.select({ next: count() }).from(skillGroups);
		await db.insert(skillGroups).values({
			title: { en: form.data.titleEn, id: form.data.titleId },
			items,
			order: next
		});
		return { newForm: form, ok: true };
	},
	update: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		const titleEn = String(fd.get('titleEn') ?? '').trim();
		const titleId = String(fd.get('titleId') ?? '').trim();
		const itemsRaw = String(fd.get('items') ?? '');
		if (!titleEn || !titleId) return fail(400, { error: 'Title required' });
		const items = itemsRaw
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);
		await db
			.update(skillGroups)
			.set({ title: { en: titleEn, id: titleId }, items })
			.where(eq(skillGroups.id, id));
		return { ok: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		await db.delete(skillGroups).where(eq(skillGroups.id, id));
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
				await tx.update(skillGroups).set({ order: i }).where(eq(skillGroups.id, ids[i]));
			}
		});
		return { ok: true };
	}
};
