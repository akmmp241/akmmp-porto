import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getPostBySlug } from '$lib/server/content';
import { renderMarkdown } from '$lib/server/markdown';
import { renderEditorJS } from '$lib/server/editorjs-renderer';

function isEditorJsContent(content: string): boolean {
	try {
		const data = JSON.parse(content);
		return !!data && typeof data === 'object' && Array.isArray(data.blocks);
	} catch {
		return false;
	}
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const post = await getPostBySlug(params.slug);
	if (!post) throw error(404, 'Post not found');

	const lang = locals.lang ?? 'en';
	const contentStr: string =
		typeof post.content === 'string'
			? post.content
			: (post.content as Record<string, string>)?.[lang] ??
				(post.content as Record<string, string>)?.en ??
				'';

	let rendered;
	if (post.contentFormat === 'editorjs' || isEditorJsContent(contentStr)) {
		let parsed: unknown = contentStr;
		try {
			parsed = JSON.parse(contentStr);
		} catch {
			parsed = { blocks: [] };
		}
		rendered = await renderEditorJS(parsed as never);
	} else {
		rendered = await renderMarkdown(contentStr);
	}

	return {
		post,
		html: rendered.html,
		toc: rendered.toc,
		readingTimeMinutes: rendered.readingTimeMinutes
	};
};
