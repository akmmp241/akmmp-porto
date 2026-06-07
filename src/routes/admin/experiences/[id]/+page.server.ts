import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { experiences } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { experienceFormSchema } from '$lib/schemas/admin';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	const [row] = await db.select().from(experiences).where(eq(experiences.id, id));
	if (!row) throw error(404, 'Experience not found');

	const form = await superValidate(
		{
			title: row.title,
			company: row.company,
			location: row.location ?? '',
			startDate: row.startDate,
			endDate: row.endDate ?? '',
			current: row.current,
			descriptionEn: row.description.en,
			descriptionId: row.description.id,
			skills: row.skills.join(', '),
			type: row.type
		},
		zod(experienceFormSchema)
	);
	return { form, mode: 'edit' as const, experience: row };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);

		const form = await superValidate(request, zod(experienceFormSchema));
		if (!form.valid) return fail(400, { form });

		const skills = form.data.skills
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		await db
			.update(experiences)
			.set({
				title: form.data.title,
				company: form.data.company,
				location: form.data.location || null,
				startDate: form.data.startDate,
				endDate: form.data.current ? null : form.data.endDate || null,
				current: form.data.current,
				description: { en: form.data.descriptionEn, id: form.data.descriptionId },
				skills,
				type: form.data.type,
				updatedAt: new Date()
			})
			.where(eq(experiences.id, id));

		throw redirect(303, '/admin/experiences');
	},
	delete: async ({ params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);
		await db.delete(experiences).where(eq(experiences.id, id));
		throw redirect(303, '/admin/experiences');
	}
};
