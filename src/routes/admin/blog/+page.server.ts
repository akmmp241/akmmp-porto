import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { blogPosts } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { refreshSearchIndex } from '$lib/server/search';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: blogPosts.id,
			slug: blogPosts.slug,
			title: blogPosts.title,
			published: blogPosts.published,
			publishedAt: blogPosts.publishedAt,
			updatedAt: blogPosts.updatedAt,
			readingTime: blogPosts.readingTime
		})
		.from(blogPosts)
		.orderBy(desc(blogPosts.updatedAt));
	return { posts: rows };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		await db.delete(blogPosts).where(eq(blogPosts.id, id));
		await refreshSearchIndex();
		return { ok: true };
	},
	togglePublish: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const fd = await request.formData();
		const id = Number(fd.get('id'));
		const value = fd.get('value') === 'true';
		if (!Number.isFinite(id)) return fail(400, { error: 'Invalid id' });
		await db
			.update(blogPosts)
			.set({
				published: value,
				publishedAt: value ? new Date() : null,
				updatedAt: new Date()
			})
			.where(eq(blogPosts.id, id));
		await refreshSearchIndex();
		return { ok: true };
	}
};
