import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { blogPosts } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { blogPostFormSchema } from '$lib/schemas/admin';
import { computeEditorJsReadingTime } from '$lib/server/editorjs-renderer';
import { parseTagCsv, syncPostTags } from '$lib/server/tags';
import { refreshSearchIndex } from '$lib/server/search';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(blogPostFormSchema));
	return { form, mode: 'new' as const };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user) throw error(401);

		const form = await superValidate(request, zod(blogPostFormSchema));
		if (!form.valid) return fail(400, { form });

		const [conflict] = await db
			.select({ c: count() })
			.from(blogPosts)
			.where(eq(blogPosts.slug, form.data.slug));
		if (conflict.c > 0) {
			form.errors.slug = ['Slug already in use'];
			return fail(400, { form });
		}

		const readingTime = await computeEditorJsReadingTime(form.data.contentFormat, form.data.content);

		const publishedAtParsed =
			form.data.published && form.data.publishedAt
				? new Date(form.data.publishedAt)
				: form.data.published
					? new Date()
					: null;

		const [row] = await db
			.insert(blogPosts)
			.values({
				slug: form.data.slug,
				title: { en: form.data.titleEn, id: form.data.titleId },
				excerpt: { en: form.data.excerptEn, id: form.data.excerptId },
				content: form.data.content,
				contentFormat: form.data.contentFormat,
				coverImage: form.data.coverImage || null,
				published: form.data.published,
				publishedAt: publishedAtParsed,
				authorId: locals.user.id,
				readingTime
			})
			.returning();

		await syncPostTags(row.id, parseTagCsv(form.data.tags));
		await refreshSearchIndex();

		// Make sure orphan-image cleanup mirrors project flow on failure paths
		void deleteProjectImage;

		throw redirect(303, `/admin/blog/${row.id}`);
	}
};
