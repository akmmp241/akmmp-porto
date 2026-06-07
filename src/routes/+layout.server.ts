import type { LayoutServerLoad } from './$types';
import { loadSite, loadAbout } from '$lib/server/content';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [site, about] = await Promise.all([loadSite(), loadAbout()]);
	return { lang: locals.lang ?? 'en', site, about };
};
