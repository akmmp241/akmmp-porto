import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { experiences } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { experienceFormSchema } from '$lib/schemas/admin';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(experienceFormSchema));
	return { form, mode: 'new' as const };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const form = await superValidate(request, zod(experienceFormSchema));
		if (!form.valid) return fail(400, { form });

		const skills = form.data.skills
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const [{ next }] = await db.select({ next: count() }).from(experiences);

		await db.insert(experiences).values({
			title: form.data.title,
			company: form.data.company,
			location: form.data.location || null,
			startDate: form.data.startDate,
			endDate: form.data.current ? null : form.data.endDate || null,
			current: form.data.current,
			description: { en: form.data.descriptionEn, id: form.data.descriptionId },
			skills,
			type: form.data.type,
			order: next
		});

		throw redirect(303, '/admin/experiences');
	}
};
