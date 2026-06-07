import type { PageServerLoad } from './$types';
import { loadExperiences } from '$lib/server/content';

export const load: PageServerLoad = async () => {
	return { experiences: await loadExperiences() };
};
