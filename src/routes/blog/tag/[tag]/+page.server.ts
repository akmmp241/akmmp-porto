import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { tags as tagsTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { listPublishedPosts } from '$lib/server/content';

export const load: PageServerLoad = async ({ params, url }) => {
	const [tag] = await db.select().from(tagsTable).where(eq(tagsTable.slug, params.tag));
	if (!tag) throw error(404, 'Tag not found');

	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const pageSize = 10;
	const { items, total } = await listPublishedPosts({ page, pageSize, tagSlug: tag.slug });

	return {
		tag,
		posts: items,
		page,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize))
	};
};
