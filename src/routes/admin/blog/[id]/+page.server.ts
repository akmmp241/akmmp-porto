import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { blogPosts, blogPostTags, tags as tagsTable } from '$lib/server/db/schema';
import { and, count, eq, ne } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { blogPostFormSchema } from '$lib/schemas/admin';
import { computeReadingTime } from '$lib/server/markdown';
import { parseTagCsv, pruneOrphanTags, syncPostTags } from '$lib/server/tags';
import { refreshSearchIndex } from '$lib/server/search';
import { deleteProjectImage } from '$lib/server/upload';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isFinite(id)) throw error(400, 'Invalid id');

	const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
	if (!row) throw error(404, 'Post not found');

	const tagRows = await db
		.select({ name: tagsTable.name })
		.from(blogPostTags)
		.innerJoin(tagsTable, eq(blogPostTags.tagId, tagsTable.id))
		.where(eq(blogPostTags.postId, id));

	const publishedAtLocal = row.publishedAt
		? new Date(row.publishedAt.getTime() - row.publishedAt.getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		: '';

	const form = await superValidate(
		{
			slug: row.slug,
			titleEn: row.title.en,
			titleId: row.title.id,
			excerptEn: row.excerpt.en,
			excerptId: row.excerpt.id,
			contentEn: row.content.en,
			contentId: row.content.id,
			coverImage: row.coverImage ?? '',
			tags: tagRows.map((t) => t.name).join(', '),
			published: row.published,
			publishedAt: publishedAtLocal
		},
		zod(blogPostFormSchema)
	);

	return { form, mode: 'edit' as const, post: row };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);

		const form = await superValidate(request, zod(blogPostFormSchema));
		if (!form.valid) return fail(400, { form });

		const [conflict] = await db
			.select({ c: count() })
			.from(blogPosts)
			.where(and(eq(blogPosts.slug, form.data.slug), ne(blogPosts.id, id)));
		if (conflict.c > 0) {
			form.errors.slug = ['Slug already in use'];
			return fail(400, { form });
		}

		const readingTime = Math.max(
			computeReadingTime(form.data.contentEn),
			computeReadingTime(form.data.contentId)
		);

		const publishedAtParsed =
			form.data.published && form.data.publishedAt
				? new Date(form.data.publishedAt)
				: form.data.published
					? new Date()
					: null;

		const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
		if (
			existing &&
			existing.coverImage &&
			form.data.coverImage &&
			existing.coverImage !== form.data.coverImage
		) {
			await deleteProjectImage(existing.coverImage);
		}

		await db
			.update(blogPosts)
			.set({
				slug: form.data.slug,
				title: { en: form.data.titleEn, id: form.data.titleId },
				excerpt: { en: form.data.excerptEn, id: form.data.excerptId },
				content: { en: form.data.contentEn, id: form.data.contentId },
				coverImage: form.data.coverImage || null,
				published: form.data.published,
				publishedAt: publishedAtParsed,
				readingTime,
				updatedAt: new Date()
			})
			.where(eq(blogPosts.id, id));

		await syncPostTags(id, parseTagCsv(form.data.tags));
		await pruneOrphanTags();
		await refreshSearchIndex();

		throw redirect(303, '/admin/blog');
	},
	delete: async ({ params, locals }) => {
		if (!locals.user) throw error(401);
		const id = Number(params.id);
		if (!Number.isFinite(id)) throw error(400);
		const [row] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
		if (row) {
			await deleteProjectImage(row.coverImage);
			await db.delete(blogPosts).where(eq(blogPosts.id, id));
			await pruneOrphanTags();
			await refreshSearchIndex();
		}
		throw redirect(303, '/admin/blog');
	}
};
