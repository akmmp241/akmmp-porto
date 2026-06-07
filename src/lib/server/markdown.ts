/**
 * Server-side markdown rendering pipeline.
 *
 * Pipeline:
 *   raw md → remark-parse → remark-gfm → collect-toc → remark-rehype →
 *   rehype-slug → rehype-autolink-headings → @shikijs/rehype →
 *   rehype-sanitize → rehype-stringify
 *
 * Also extracts a heading tree (h2/h3) for the table of contents and a
 * reading-time estimate.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize';
import { visit } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import readingTime from 'reading-time';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import type { Root as MdRoot, Heading } from 'mdast';

export interface TocEntry {
	depth: 2 | 3;
	id: string;
	text: string;
}

export interface RenderedMarkdown {
	html: string;
	toc: TocEntry[];
	readingTimeMinutes: number;
}

const sanitizeSchema: SanitizeOptions = {
	...defaultSchema,
	tagNames: [...(defaultSchema.tagNames ?? []), 'span', 'section', 'sup', 'a'],
	attributes: {
		...defaultSchema.attributes,
		'*': [
			...((defaultSchema.attributes?.['*'] as string[]) ?? []),
			'className',
			'style',
			'id',
			['data*', /.+/]
		],
		span: [
			...((defaultSchema.attributes?.span as string[]) ?? []),
			'className',
			'style',
			['data*', /.+/]
		],
		code: [
			...((defaultSchema.attributes?.code as string[]) ?? []),
			'className',
			'style',
			['data*', /.+/]
		],
		pre: [
			...((defaultSchema.attributes?.pre as string[]) ?? []),
			'className',
			'style',
			['data*', /.+/]
		],
		a: [
			...((defaultSchema.attributes?.a as string[]) ?? []),
			'target',
			'rel',
			'ariaLabel',
			'ariaHidden'
		]
	}
};

/** Collects h2/h3 entries while traversing the MDAST. */
function remarkCollectToc(out: TocEntry[]): Plugin<[], MdRoot> {
	return () => (tree) => {
		const slugger = new GithubSlugger();
		visit(tree, 'heading', (node: Heading) => {
			if (node.depth !== 2 && node.depth !== 3) return;
			const text = mdastToString(node).trim();
			if (!text) return;
			const id = slugger.slug(text);
			out.push({ depth: node.depth, id, text });
		});
	};
}

export async function renderMarkdown(md: string): Promise<RenderedMarkdown> {
	const toc: TocEntry[] = [];
	const processor = unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkCollectToc(toc))
		.use(remarkRehype, { allowDangerousHtml: false })
		.use(rehypeSlug)
		.use(rehypeAutolinkHeadings, {
			behavior: 'append',
			properties: {
				className: ['heading-anchor'],
				ariaLabel: 'Link to heading',
				tabIndex: -1
			},
			content: {
				type: 'element',
				tagName: 'span',
				properties: { className: ['heading-anchor-icon'], ariaHidden: 'true' },
				children: [{ type: 'text', value: '#' }]
			}
		})
		.use(rehypeShiki, {
			themes: { light: 'github-light', dark: 'github-dark-dimmed' },
			defaultColor: false,
			fallbackLanguage: 'text'
		})
		.use(rehypeSanitize, sanitizeSchema)
		.use(rehypeStringify);

	const file = await processor.process(md ?? '');
	return {
		html: String(file),
		toc,
		readingTimeMinutes: computeReadingTime(md)
	};
}

/** Cheaper helper used at write-time (admin save) to compute reading time. */
export function computeReadingTime(md: string): number {
	if (!md) return 1;
	return Math.max(1, Math.round(readingTime(md).minutes));
}
