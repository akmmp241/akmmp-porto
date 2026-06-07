import type { PageServerLoad } from './$types';
import { loadProjects } from '$lib/server/content';

export const load: PageServerLoad = async () => {
	return { projects: await loadProjects() };
};
