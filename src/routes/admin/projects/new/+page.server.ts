import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { projectFormSchema } from '$lib/schemas/admin';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(projectFormSchema));
	return { form, mode: 'new' as const };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const form = await superValidate(request, zod(projectFormSchema));
		if (!form.valid) return fail(400, { form });

		const techstack = form.data.techstack
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const [exists] = await db
			.select({ c: count() })
			.from(projects)
			.where(eq(projects.slug, form.data.slug));
		if (exists.c > 0) {
			form.errors.slug = ['Slug already in use'];
			return fail(400, { form });
		}

		const [{ next }] = await db
			.select({ next: count() })
			.from(projects);

		await db.insert(projects).values({
			slug: form.data.slug,
			title: form.data.title,
			description: { en: form.data.descriptionEn, id: form.data.descriptionId },
			techstack,
			image: form.data.image || null,
			badges: {
				...(form.data.badgeFe ? { fe: form.data.badgeFe } : {}),
				...(form.data.badgeBe ? { be: form.data.badgeBe } : {}),
				...(form.data.badgeLive ? { live: form.data.badgeLive } : {})
			},
			featured: form.data.featured,
			order: next
		});

		throw redirect(303, '/admin/projects');
	}
};
