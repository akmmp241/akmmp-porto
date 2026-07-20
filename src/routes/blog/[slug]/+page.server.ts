import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { renderEditorJS, type EditorJSOutputData } from '$lib/server/editorjs-renderer';
import { isEditorJsContent } from '$lib/server/editorjs-validator';

export const load: PageServerLoad = async ({ params, locals }) => {
	const post = await getPostBySlug(params.slug);
	if (!post) throw error(404, 'Post not found');

	const lang = locals.lang ?? 'en';
	const rawContent: unknown = post.content;
	let rendered;

	if (isEditorJsContent(rawContent)) {
		rendered = await renderEditorJS(
			typeof rawContent === 'string' ? JSON.parse(rawContent) : (rawContent as EditorJSOutputData)
		);
	} else {
		const contentStr =
			typeof rawContent === 'string'
				? rawContent
				: (rawContent as Record<string, string>)?.[lang] ??
					(rawContent as Record<string, string>)?.en ??
					'';

		if (isEditorJsContent(contentStr)) {
			rendered = await renderEditorJS(JSON.parse(contentStr));
		} else {
			rendered = await renderMarkdown(contentStr);
		}
	}

	return {
		post,
		html: rendered.html,
		toc: rendered.toc,
		readingTimeMinutes: rendered.readingTimeMinutes
	};
};
