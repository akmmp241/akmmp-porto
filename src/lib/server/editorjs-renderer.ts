/**
 * Server-side Editor.js JSON renderer.
 *
 * Converts Editor.js OutputData to HTML with TOC extraction and reading time.
 * Returns same interface as renderMarkdown() for unified downstream handling.
 */
import { codeToHtml } from 'shiki';
import GithubSlugger from 'github-slugger';
import readingTime from 'reading-time';
import type { TocEntry, RenderedMarkdown } from './markdown';
import { computeReadingTime } from './markdown';

type EditorJSBlock =
	| { type: 'header'; data: { text: string; level: number } }
	| { type: 'paragraph'; data: { text: string } }
	| { type: 'list'; data: { style: 'ordered' | 'unordered'; items: Array<string | { content: string; meta?: any; items?: any[] }> } }
	| { type: 'code'; data: { code: string; language?: string } }
	| { type: 'image'; data: { url?: string; file?: { url?: string }; caption?: string; withBorder?: boolean; stretched?: boolean; withBackground?: boolean } }
	| { type: 'quote'; data: { text: string; caption?: string; alignment?: string } }
	| { type: 'embed'; data: { service: string; source: string; embed: string; width?: number; height?: number; caption?: string } }
	| { type: 'callout'; data: { text: string; variant: 'info' | 'warning' | 'tip' | 'danger' } }
	| { type: 'delimiter'; data: object };

export interface EditorJSOutputData {
	time?: number;
	blocks: EditorJSBlock[];
	version?: string;
}

const slugger = new GithubSlugger();

/** Allowed URL schemes for links/images. Blocks javascript:, data:, vbscript:, etc. */
function isSafeUrl(url: string): boolean {
	const trimmed = url.trim();
	// Allow relative URLs and anchors
	if (/^(\/|#|\.\/|\.\.\/)/.test(trimmed)) return true;
	return /^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed);
}

/**
 * Parse inline markup on text that has ALREADY been HTML-escaped.
 * Escaping happens first so block text cannot inject tags; markdown
 * delimiters (* ` = [ ] ( )) survive escaping untouched.
 */
function parseInline(escaped: string): string {
	if (!escaped) return '';
	let result = escaped;
	// Bold: **text**
	result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	// Italic: *text*
	result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	// Mark: ==text==
	result = result.replace(/==([^=]+)==/g, '<mark>$1</mark>');
	// Code: `text`
	result = result.replace(/`([^`]+)`/g, '<code>$1</code>');
	// Link: [text](url) — url already escaped (&quot; etc.); reject unsafe schemes
	result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
		const decoded = url.replace(/&amp;/g, '&');
		if (!isSafeUrl(decoded)) return label;
		return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
	});
	return result;
}

/** Escape then parse inline markup — the safe path for all user block text. */
function inline(text: string): string {
	return parseInline(escapeHtml(text ?? ''));
}

/** Strip inline markup to plain text (for TOC ids and reading time). */
function stripMarkup(text: string): string {
	if (!text) return '';
	return text
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/==([^=]+)==/g, '$1')
		.replace(/`([^`]+)`/g, '$1')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

const EMBED_ALLOWED_ORIGINS = [
	'youtube.com', 'www.youtube.com',
	'youtu.be',
	'vimeo.com', 'player.vimeo.com',
	'codepen.io',
	'github.com', 'gist.github.com',
];

/** Validate embed src — returns safe src string or null. */
function safeEmbedSrc(embedHtml: string): string | null {
	const match = embedHtml.match(/src=["']([^"']+)["']/i);
	if (!match) return null;
	try {
		const url = new URL(match[1]);
		if (!['https:', 'http:'].includes(url.protocol)) return null;
		const origin = url.hostname.replace(/^www\./, '');
		if (EMBED_ALLOWED_ORIGINS.some((o) => url.hostname === o || url.hostname.endsWith('.' + o))) {
			return match[1];
		}
		void origin;
		return null;
	} catch {
		return null;
	}
}

/** Validate input before rendering — guards against malformed DB content. */
function validateOutputData(input: unknown): EditorJSOutputData | null {
	if (!input || typeof input !== 'object') return null;
	const data = input as Record<string, unknown>;
	if (!Array.isArray(data.blocks)) return null;
	return data as unknown as EditorJSOutputData;
}

async function renderBlock(block: EditorJSBlock, toc: TocEntry[]): Promise<string> {
	switch (block.type) {
		case 'header': {
			const { text, level } = block.data;
			if (!text) return '';
			const tag = `h${Math.min(6, Math.max(1, level))}`;
			const id = slugger.slug(stripMarkup(text));
			if ((level === 2 || level === 3) && text) {
				toc.push({ depth: level as 2 | 3, id, text: stripMarkup(text) });
			}
			return `<${tag} id="${id}">${inline(text)}</${tag}>`;
		}

		case 'paragraph': {
			const { text } = block.data;
			if (!text) return '';
			return `<p>${inline(text)}</p>`;
		}

		case 'list': {
			const { style, items } = block.data;
			if (!items?.length) return '';
			const tag = style === 'ordered' ? 'ol' : 'ul';
			const itemsHtml = items.map((item) => {
				const text = typeof item === 'string' ? item : item.content || '';
				return `<li>${inline(text)}</li>`;
			}).join('');
			return `<${tag}>${itemsHtml}</${tag}>`;
		}

		case 'code': {
			const { code, language } = block.data;
			if (!code) return '';
			try {
				const html = await codeToHtml(code, {
					lang: language || 'text',
					themes: { light: 'github-light', dark: 'github-dark-dimmed' },
					defaultColor: false
				});
				return html;
			} catch {
				return `<pre><code>${escapeHtml(code)}</code></pre>`;
			}
		}

		case 'image': {
			const { caption, withBorder, stretched, withBackground } = block.data;
			const url = block.data.file?.url ?? block.data.url;
			if (!url || !isSafeUrl(url)) return '';
			const classes = [];
			if (withBorder) classes.push('image-border');
			if (stretched) classes.push('image-stretched');
			if (withBackground) classes.push('image-background');
			const classAttr = classes.length ? ` class="${classes.join(' ')}"` : '';
			const imgTag = `<img src="${escapeHtml(url)}" alt="${escapeHtml(caption || '')}" loading="lazy"${classAttr}>`;
			if (caption) {
				return `<figure>${imgTag}<figcaption>${inline(caption)}</figcaption></figure>`;
			}
			return `<figure>${imgTag}</figure>`;
		}

		case 'quote': {
			const { text, caption, alignment } = block.data;
			if (!text) return '';
			const alignClass = alignment === 'center' ? ' class="text-center"' : '';
			const content = inline(text);
			if (caption) {
				return `<blockquote${alignClass}><p>${content}</p><footer>${inline(caption)}</footer></blockquote>`;
			}
			return `<blockquote${alignClass}><p>${content}</p></blockquote>`;
		}

		case 'embed': {
			const { embed, caption } = block.data;
			if (!embed) return '';
			const safeSrc = safeEmbedSrc(embed);
			if (!safeSrc) return '';
			const iframe = `<iframe src="${escapeHtml(safeSrc)}" frameborder="0" allowfullscreen loading="lazy"></iframe>`;
			const wrapper = `<div class="embed-responsive">${iframe}</div>`;
			if (caption) {
				return `<figure>${wrapper}<figcaption>${inline(caption)}</figcaption></figure>`;
			}
			return wrapper;
		}

		case 'callout': {
			const { text, variant } = block.data;
			if (!text) return '';
			const allowed = ['info', 'warning', 'tip', 'danger'];
			const v = allowed.includes(variant) ? variant : 'info';
			return `<aside class="callout callout-${v}">${inline(text)}</aside>`;
		}

		case 'delimiter':
			return '<hr>';

		default:
			return '';
	}
}

function extractText(block: EditorJSBlock): string {
	switch (block.type) {
		case 'header':
			return stripMarkup(block.data.text || '');
		case 'paragraph':
			return stripMarkup(block.data.text || '');
		case 'list':
			return block.data.items?.map((item) => {
				const text = typeof item === 'string' ? item : item.content || '';
				return stripMarkup(text);
			}).join(' ') || '';
		case 'code':
			return block.data.code || '';
		case 'quote':
			return stripMarkup(block.data.text || '') + ' ' + stripMarkup(block.data.caption || '');
		case 'callout':
			return stripMarkup(block.data.text || '');
		default:
			return '';
	}
}

export async function renderEditorJS(data: EditorJSOutputData): Promise<RenderedMarkdown> {
	const valid = validateOutputData(data);
	if (!valid || !valid.blocks.length) {
		return { html: '', toc: [], readingTimeMinutes: 1 };
	}

	slugger.reset();
	const toc: TocEntry[] = [];
	const htmlBlocks: string[] = [];

	for (const block of valid.blocks) {
		const html = await renderBlock(block, toc);
		if (html) htmlBlocks.push(html);
	}

	const fullText = valid.blocks.map(extractText).join(' ');
	const readingTimeMinutes = fullText ? Math.max(1, Math.round(readingTime(fullText).minutes)) : 1;

	return {
		html: htmlBlocks.join('\n'),
		toc,
		readingTimeMinutes
	};
}

/**
 * Compute reading time at write-time, format-aware.
 * Editor.js content is parsed and rendered for an accurate count;
 * markdown falls back to the cheap word-count helper.
 */
export async function computeEditorJsReadingTime(format: string, content: string): Promise<number> {
	if (format === 'editorjs') {
		try {
			const parsed = JSON.parse(content);
			return (await renderEditorJS(parsed)).readingTimeMinutes;
		} catch {
			return 1;
		}
	}
	return computeReadingTime(content);
}
