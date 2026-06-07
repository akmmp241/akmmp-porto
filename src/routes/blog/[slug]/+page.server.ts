import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { tr } from '$lib/i18n';

export const load: PageServerLoad = async ({ params, locals }) => {
	const post = await getPostBySlug(params.slug);
	if (!post) throw error(404, 'Post not found');

	const lang = locals.lang ?? 'en';
	const md = tr(post.content, lang);
	const rendered = await renderMarkdown(md);

	return {
		post,
		html: rendered.html,
		toc: rendered.toc,
		readingTimeMinutes: rendered.readingTimeMinutes
	};
};
