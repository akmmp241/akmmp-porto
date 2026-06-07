import type { PageServerLoad } from './$types';
import { loadProjects, loadExperiences, loadSkillGroups } from '$lib/server/content';
import { getGitHubStats } from '$lib/server/github';

export const load: PageServerLoad = async () => {
	const [projects, experiences, skillGroups, github] = await Promise.all([
		loadProjects(),
		loadExperiences(),
		loadSkillGroups(),
		getGitHubStats().catch((err) => {
			console.warn('[home] GitHub stats failed:', err);
			return null;
		})
	]);
	return {
		projects: projects.filter((p) => p.featured),
		experiences,
		skillGroups,
		github
	};
};
