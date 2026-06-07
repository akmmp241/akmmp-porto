import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getProjectBySlug, getRelatedProjects } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { tr } from '$lib/i18n';

export const load: PageServerLoad = async ({ params, locals }) => {
	const project = await getProjectBySlug(params.slug);
	if (!project) throw error(404, 'Project not found');

	const lang = locals.lang ?? 'en';

	let html: string | null = null;
	let toc: Awaited<ReturnType<typeof renderMarkdown>>['toc'] = [];
	let readingTimeMinutes = 0;

	if (project.caseStudy) {
		const md = tr(project.caseStudy, lang);
		if (md.trim()) {
			const rendered = await renderMarkdown(md);
			html = rendered.html;
			toc = rendered.toc;
			readingTimeMinutes = rendered.readingTimeMinutes;
		}
	}

	const related = await getRelatedProjects(project.id, 3);

	return { project, html, toc, readingTimeMinutes, related };
};
