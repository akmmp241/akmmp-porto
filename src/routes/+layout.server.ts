import type { LayoutServerLoad } from './$types';
import { loadSite } from '$lib/server/content';

export const load: LayoutServerLoad = async ({ locals }) => {
	const site = await loadSite();
	return { lang: locals.lang ?? 'en', site };
};
