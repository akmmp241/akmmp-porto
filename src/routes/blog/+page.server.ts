import type { PageServerLoad } from './$types';
import { listAllTags, listPublishedPosts } from '$lib/server/content';

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
	const pageSize = 10;
	const [{ items, total }, tags] = await Promise.all([
		listPublishedPosts({ page, pageSize }),
		listAllTags()
	]);
	return {
		posts: items,
		tags,
		page,
		pageSize,
		total,
		totalPages: Math.max(1, Math.ceil(total / pageSize))
	};
};
