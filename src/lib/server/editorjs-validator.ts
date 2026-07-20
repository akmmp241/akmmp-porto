/**
 * Strict Editor.js content validator for the blog admin API.
 *
 * Whitelist mirrors the admin block-editor: header, paragraph, list, code,
 * image, quote, embed, delimiter, callout. Text fields reject raw HTML/script
 * tags; URLs are restricted to http(s)/mailto/relative.
 */

const ALLOWED_BLOCK_TYPES = [
	'header',
	'paragraph',
	'list',
	'code',
	'image',
	'quote',
	'embed',
	'delimiter',
	'callout'
] as const;

type AllowedBlockType = (typeof ALLOWED_BLOCK_TYPES)[number];

export interface ValidationError {
	path: string;
	message: string;
}

export interface ValidatedContent {
	time?: number;
	blocks: Array<{ type: AllowedBlockType; data: Record<string, unknown> }>;
	version?: string;
}

const HTML_TAG_RE = /<\/?\s*[a-zA-Z][^>]*>/;

function looksLikeRawHtml(text: string): boolean {
	if (!text) return false;
	if (HTML_TAG_RE.test(text)) {
		const lower = text.toLowerCase();
		if (
			lower.includes('<script') ||
			lower.includes('</script') ||
			lower.includes('<iframe') ||
			lower.includes('<style') ||
			lower.includes('javascript:') ||
			lower.includes(' onerror=') ||
			lower.includes(' onload=') ||
			lower.includes(' onclick=')
		) {
			return true;
		}
		return true;
	}
	return false;
}

function isSafeUrl(url: string): boolean {
	if (typeof url !== 'string' || !url) return false;
	const t = url.trim();
	if (/^(\/|#|\.\/|\.\.\/)/.test(t)) return true;
	return /^https?:\/\//i.test(t) || /^mailto:/i.test(t);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateText(
	value: unknown,
	path: string,
	errors: ValidationError[],
	required = false
): void {
	if (value === undefined || value === null || value === '') {
		if (required) errors.push({ path, message: 'is required' });
		return;
	}
	if (typeof value !== 'string') {
		errors.push({ path, message: 'must be a string' });
		return;
	}
	if (looksLikeRawHtml(value)) {
		errors.push({ path, message: 'contains disallowed HTML/script' });
	}
}

function validateBlock(
	block: unknown,
	idx: number,
	errors: ValidationError[]
): void {
	const path = `blocks[${idx}]`;
	if (!isPlainObject(block)) {
		errors.push({ path, message: 'must be an object' });
		return;
	}
	const type = block.type;
	if (typeof type !== 'string') {
		errors.push({ path: `${path}.type`, message: 'must be a string' });
		return;
	}
	if (!ALLOWED_BLOCK_TYPES.includes(type as AllowedBlockType)) {
		errors.push({
			path: `${path}.type`,
			message: `unsupported block type "${type}". allowed: ${ALLOWED_BLOCK_TYPES.join(', ')}`
		});
		return;
	}
	const data = block.data;
	if (!isPlainObject(data)) {
		errors.push({ path: `${path}.data`, message: 'must be an object' });
		return;
	}

	switch (type as AllowedBlockType) {
		case 'header': {
			validateText(data.text, `${path}.data.text`, errors, true);
			const level = data.level;
			if (level !== undefined && (typeof level !== 'number' || ![2, 3, 4].includes(level))) {
				errors.push({ path: `${path}.data.level`, message: 'must be 2..4' });
			}
			break;
		}
		case 'paragraph': {
			validateText(data.text, `${path}.data.text`, errors, true);
			break;
		}
		case 'list': {
			const items = data.items;
			if (!Array.isArray(items) || items.length === 0) {
				errors.push({ path: `${path}.data.items`, message: 'must be a non-empty array' });
				break;
			}
			items.forEach((item, i) => {
				if (typeof item === 'string') {
					validateText(item, `${path}.data.items[${i}]`, errors);
				} else if (isPlainObject(item)) {
					validateText(item.content, `${path}.data.items[${i}].content`, errors);
				} else {
					errors.push({
						path: `${path}.data.items[${i}]`,
						message: 'must be a string or {content} object'
					});
				}
			});
			const style = data.style;
			if (style !== undefined && style !== 'ordered' && style !== 'unordered') {
				errors.push({
					path: `${path}.data.style`,
					message: 'must be "ordered" or "unordered"'
				});
			}
			break;
		}
		case 'code': {
			if (typeof data.code !== 'string' || data.code.length === 0) {
				errors.push({ path: `${path}.data.code`, message: 'must be a non-empty string' });
			}
			break;
		}
		case 'image': {
			const url = (data.url as string) ?? ((data.file as Record<string, unknown>)?.url as string);
			if (typeof url !== 'string' || !isSafeUrl(url)) {
				errors.push({
					path: `${path}.data.url`,
					message: 'image url must be http(s) or relative path'
				});
			}
			validateText(data.caption, `${path}.data.caption`, errors);
			break;
		}
		case 'quote': {
			validateText(data.text, `${path}.data.text`, errors, true);
			validateText(data.caption, `${path}.data.caption`, errors);
			break;
		}
		case 'embed': {
			if (typeof data.embed !== 'string' || !data.embed) {
				errors.push({ path: `${path}.data.embed`, message: 'is required' });
			}
			validateText(data.caption, `${path}.data.caption`, errors);
			break;
		}
		case 'callout': {
			validateText(data.text, `${path}.data.text`, errors, true);
			const variant = data.variant;
			if (
				variant !== undefined &&
				variant !== 'info' &&
				variant !== 'warning' &&
				variant !== 'tip' &&
				variant !== 'danger'
			) {
				errors.push({
					path: `${path}.data.variant`,
					message: 'must be info|warning|tip|danger'
				});
			}
			break;
		}
		case 'delimiter':
			break;
	}
}

export interface ValidationResult {
	ok: boolean;
	parsed?: ValidatedContent;
	errors: ValidationError[];
}

export function isEditorJsContent(raw: unknown): boolean {
	let value = raw;
	if (typeof value === 'string') {
		try {
			value = JSON.parse(value);
		} catch {
			return false;
		}
	}
	return isPlainObject(value) && Array.isArray(value.blocks);
}

export function validateEditorJsContent(raw: unknown): ValidationResult {
	const errors: ValidationError[] = [];

	let obj: unknown = raw;
	if (typeof raw === 'string') {
		try {
			obj = JSON.parse(raw);
		} catch {
			return { ok: false, errors: [{ path: 'content', message: 'invalid JSON' }] };
		}
	}
	if (!isPlainObject(obj)) {
		return { ok: false, errors: [{ path: 'content', message: 'must be an object' }] };
	}
	if (!Array.isArray(obj.blocks)) {
		return {
			ok: false,
			errors: [{ path: 'content.blocks', message: 'must be an array' }]
		};
	}
	if (obj.blocks.length === 0) {
		errors.push({ path: 'content.blocks', message: 'must contain at least one block' });
	}
	obj.blocks.forEach((block, i) => validateBlock(block, i, errors));

	if (errors.length > 0) return { ok: false, errors };

	return {
		ok: true,
		parsed: {
			time: typeof obj.time === 'number' ? obj.time : undefined,
			blocks: obj.blocks as ValidatedContent['blocks'],
			version: typeof obj.version === 'string' ? obj.version : undefined
		},
		errors: []
	};
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateSlug(slug: string): ValidationError | null {
	if (!slug) return { path: 'slug', message: 'is required' };
	if (slug.length > 120) return { path: 'slug', message: 'max 120 chars' };
	if (!SLUG_RE.test(slug)) {
		return {
			path: 'slug',
			message: 'must be lowercase letters, digits, and hyphens (no leading/trailing/consecutive hyphens)'
		};
	}
	return null;
}

export function validateTitle(title: string): ValidationError | null {
	if (!title) return { path: 'title', message: 'is required' };
	if (title.length > 120) return { path: 'title', message: 'max 120 chars' };
	if (looksLikeRawHtml(title)) {
		return { path: 'title', message: 'contains disallowed HTML/script' };
	}
	return null;
}

export function validateExcerpt(excerpt: string): ValidationError | null {
	if (!excerpt) return null;
	if (excerpt.length > 300) return { path: 'excerpt', message: 'max 300 chars' };
	if (looksLikeRawHtml(excerpt)) {
		return { path: 'excerpt', message: 'contains disallowed HTML/script' };
	}
	return null;
}
