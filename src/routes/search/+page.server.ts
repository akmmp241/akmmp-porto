import type { PageServerLoad } from './$types';
import { search, type SearchType } from '$lib/server/search';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const typeParam = url.searchParams.get('type');
	const type: SearchType =
		typeParam === 'post' || typeParam === 'project' ? (typeParam as SearchType) : 'all';

	const lang = locals.lang ?? 'en';
	const results = q ? await search(q, lang, type, 30) : [];

	return {
		q,
		type,
		results,
		counts: {
			all: results.length,
			post: results.filter((r) => r.type === 'post').length,
			project: results.filter((r) => r.type === 'project').length
		}
	};
};
