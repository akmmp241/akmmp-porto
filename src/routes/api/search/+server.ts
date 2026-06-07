import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { search, type SearchType } from '$lib/server/search';

export const GET: RequestHandler = async ({ url, locals }) => {
	const q = (url.searchParams.get('q') ?? '').trim();
	const typeParam = url.searchParams.get('type');
	const type: SearchType =
		typeParam === 'post' || typeParam === 'project' ? (typeParam as SearchType) : 'all';
	const langParam = url.searchParams.get('lang');
	const lang =
		langParam === 'en' || langParam === 'id' ? (langParam as 'en' | 'id') : (locals.lang ?? 'en');

	if (!q) return json({ q: '', results: [] });

	const results = await search(q, lang, type, 30);
	return json(
		{ q, type, lang, results },
		{
			headers: {
				'Cache-Control': 'no-store'
			}
		}
	);
};
