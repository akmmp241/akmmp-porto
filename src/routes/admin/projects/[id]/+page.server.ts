import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, projectCaseStudies } from '$lib/server/db/schema';
import { and, count, eq, ne } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { caseStudyFormSchema, projectFormSchema } from '$lib/schemas/admin';
import { deleteProjectImage } from '$lib/server/upload';
import { refreshSearchIndex } from '$lib/server/search';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');
	const [row] = await db.select().from(projects).where(eq(projects.id, id));
	if (!row) throw error(404, 'Project not found');

	const [cs] = await db
		.select()
		.from(projectCaseStudies)
		.where(eq(projectCaseStudies.projectId, id));

	const form = await superValidate(
		{
			slug: row.slug,
			title: row.title,
			descriptionEn: row.description.en,
			descriptionId: row.description.id,
			techstack: row.techstack.join(', '),
			image: row.image ?? '',
			badgeFe: row.badges.fe ?? '',
			badgeBe: row.badges.be ?? '',
			badgeLive: row.badges.live ?? '',
			featured: row.featured
		},
		zod(projectFormSchema)
	);

	const caseStudyForm = await superValidate(
		{
			contentEn: cs?.content?.en ?? '',
			contentId: cs?.content?.id ?? '',
			gallery: (cs?.gallery ?? []).join('\n')
		},
		zod(caseStudyFormSchema)
	);

	return { form, caseStudyForm, mode: 'edit' as const, project: row };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);

		const form = await superValidate(request, zod(projectFormSchema));
		if (!form.valid) return fail(400, { form });

		const [conflict] = await db
			.select({ c: count() })
			.from(projects)
			.where(and(eq(projects.slug, form.data.slug), ne(projects.id, id)));
		if (conflict.c > 0) {
			form.errors.slug = ['Slug already in use'];
			return fail(400, { form });
		}

		const techstack = form.data.techstack
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const [existing] = await db.select().from(projects).where(eq(projects.id, id));
		if (existing && existing.image && form.data.image && existing.image !== form.data.image) {
			await deleteProjectImage(existing.image);
		}

		await db
			.update(projects)
			.set({
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
				updatedAt: new Date()
			})
			.where(eq(projects.id, id));

		await refreshSearchIndex();
		throw redirect(303, '/admin/projects');
	},
	saveCaseStudy: async ({ request, params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);

		const form = await superValidate(request, zod(caseStudyFormSchema));
		if (!form.valid) return fail(400, { caseStudyForm: form });

		const gallery = form.data.gallery
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);

		const hasContent = !!(form.data.contentEn.trim() || form.data.contentId.trim());

		if (!hasContent && gallery.length === 0) {
			await db.delete(projectCaseStudies).where(eq(projectCaseStudies.projectId, id));
		} else {
			await db
				.insert(projectCaseStudies)
				.values({
					projectId: id,
					content: { en: form.data.contentEn, id: form.data.contentId },
					gallery,
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: projectCaseStudies.projectId,
					set: {
						content: { en: form.data.contentEn, id: form.data.contentId },
						gallery,
						updatedAt: new Date()
					}
				});
		}

		await refreshSearchIndex();
		return { caseStudyForm: form, ok: true };
	},
	delete: async ({ params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);
		const [row] = await db.select().from(projects).where(eq(projects.id, id));
		if (row) {
			await deleteProjectImage(row.image);
			await db.delete(projects).where(eq(projects.id, id));
			await refreshSearchIndex();
		}
		throw redirect(303, '/admin/projects');
	}
};
