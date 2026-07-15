import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from './db';
import { blogPosts, blogPostTags, tags as tagsTable, type BlogPostRow } from './db/schema';
import { computeEditorJsReadingTime } from './editorjs-renderer';
import {
	validateEditorJsContent,
	validateExcerpt,
	validateSlug,
	validateTitle,
	type ValidationError
} from './editorjs-validator';
import { refreshSearchIndex } from './search';
import { pruneOrphanTags, syncPostTags } from './tags';

export interface BlogPostDto {
	id: number;
	slug: string;
	title: { en: string; id: string };
	excerpt: { en: string; id: string };
	content: string;
	contentFormat: string;
	coverImage: string | null;
	published: boolean;
	publishedAt: string | null;
	readingTime: number;
	tags: string[];
	createdAt: string;
	updatedAt: string;
}

export interface BlogPostSummaryDto {
	id: number;
	slug: string;
	title: { en: string; id: string };
	published: boolean;
	publishedAt: string | null;
	readingTime: number;
	createdAt: string;
	updatedAt: string;
}

export interface BlogValidationFailure {
	code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT';
	message: string;
	details?: ValidationError[];
}

export class BlogServiceError extends Error {
	constructor(
		public failure: BlogValidationFailure,
		public status: number
	) {
		super(failure.message);
	}
}

export interface CreatePostInput {
	titleEn: string;
	titleId: string;
	content: string;
	excerptEn: string;
	excerptId: string;
	tags?: string[];
	slug?: string;
	coverImage?: string | null;
	authorId?: string | null;
}

export interface UpdatePostInput {
	id: number;
	titleEn?: string;
	titleId?: string;
	content?: string;
	excerptEn?: string;
	excerptId?: string;
	tags?: string[];
	slug?: string;
	coverImage?: string | null;
}

function toDto(post: BlogPostRow, tags: string[]): BlogPostDto {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		excerpt: post.excerpt,
		content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
		contentFormat: post.contentFormat,
		coverImage: post.coverImage ?? null,
		published: post.published,
		publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
		readingTime: post.readingTime,
		tags,
		createdAt: post.createdAt.toISOString(),
		updatedAt: post.updatedAt.toISOString()
	};
}

function toSummary(post: BlogPostRow): BlogPostSummaryDto {
	return {
		id: post.id,
		slug: post.slug,
		title: post.title,
		published: post.published,
		publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
		readingTime: post.readingTime,
		createdAt: post.createdAt.toISOString(),
		updatedAt: post.updatedAt.toISOString()
	};
}

async function fetchPostTags(postId: number): Promise<string[]> {
	const rows = await db
		.select({ name: tagsTable.name })
		.from(blogPostTags)
		.innerJoin(tagsTable, eq(blogPostTags.tagId, tagsTable.id))
		.where(eq(blogPostTags.postId, postId));
	return rows.map((row) => row.name);
}

export function generateSlug(value: string): string {
	return slugify(value);
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 120);
}

async function findSlugConflict(slug: string, excludeId?: number): Promise<number | null> {
	const where = excludeId
		? and(eq(blogPosts.slug, slug), ne(blogPosts.id, excludeId))
		: eq(blogPosts.slug, slug);
	const [row] = await db.select({ id: blogPosts.id }).from(blogPosts).where(where);
	return row?.id ?? null;
}

export async function generateUniqueSlug(base: string): Promise<string> {
	const clean = slugify(base) || 'post';
	let candidate = clean;
	let suffix = 1;
	while (await findSlugConflict(candidate)) {
		suffix += 1;
		candidate = `${clean}-${suffix}`;
	}
	return candidate;
}

function validationError(details: ValidationError[]): never {
	throw new BlogServiceError(
		{ code: 'VALIDATION_ERROR', message: 'Validation failed', details },
		400
	);
}

function notFound(): never {
	throw new BlogServiceError({ code: 'NOT_FOUND', message: 'Post not found' }, 404);
}

function conflict(message: string): never {
	throw new BlogServiceError({ code: 'CONFLICT', message }, 409);
}

function validateTextFields(title: string, excerpt: string): ValidationError[] {
	return [validateTitle(title), validateExcerpt(excerpt)].filter(Boolean) as ValidationError[];
}

export async function listPosts(input: {
	status?: 'draft' | 'published';
	limit?: number;
	offset?: number;
}): Promise<BlogPostSummaryDto[]> {
	const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);
	const offset = Math.max(input.offset ?? 0, 0);
	const query = db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt)).limit(limit).offset(offset);

	if (input.status === 'published') return (await query.where(eq(blogPosts.published, true))).map(toSummary);
	if (input.status === 'draft') return (await query.where(eq(blogPosts.published, false))).map(toSummary);
	return (await query).map(toSummary);
}

export async function getDraftPost(input: { id?: number; slug?: string }): Promise<BlogPostDto> {
	if (input.id === undefined && !input.slug) validationError([{ path: 'id', message: 'id or slug is required' }]);
	const [row] = input.id !== undefined
		? await db.select().from(blogPosts).where(and(eq(blogPosts.id, input.id), eq(blogPosts.published, false)))
		: await db.select().from(blogPosts).where(and(eq(blogPosts.slug, input.slug!), eq(blogPosts.published, false)));
	if (!row) notFound();
	if (row.contentFormat !== 'editorjs') validationError([{ path: 'contentFormat', message: 'draft must use editorjs format' }]);
	return toDto(row, await fetchPostTags(row.id));
}

export async function getPost(input: { id?: number; slug?: string }): Promise<BlogPostDto> {
	if (input.id === undefined && !input.slug) validationError([{ path: 'id', message: 'id or slug is required' }]);
	const [row] = input.id !== undefined
		? await db.select().from(blogPosts).where(eq(blogPosts.id, input.id))
		: await db.select().from(blogPosts).where(eq(blogPosts.slug, input.slug!));
	if (!row) notFound();
	return toDto(row, await fetchPostTags(row.id));
}

export async function createPost(input: CreatePostInput): Promise<BlogPostDto> {
	const titleEn = input.titleEn;
	const titleId = input.titleId;
	const excerptEn = input.excerptEn;
	const excerptId = input.excerptId;
	const errors = [
		...validateTextFields(titleEn, excerptEn),
		...validateTextFields(titleId, excerptId),
		...validateEditorJsContent(input.content).errors
	];
	if (input.slug) {
		const slugError = validateSlug(input.slug);
		if (slugError) errors.push(slugError);
	}
	if (errors.length) validationError(errors);

	const slug = input.slug ?? (await generateUniqueSlug(titleEn));
	if (await findSlugConflict(slug)) conflict(`Slug "${slug}" is already in use`);
	const readingTime = await computeEditorJsReadingTime('editorjs', input.content);
	const [row] = await db
		.insert(blogPosts)
		.values({
			slug,
			title: { en: titleEn, id: titleId },
			excerpt: { en: excerptEn, id: excerptId },
			content: input.content,
			contentFormat: 'editorjs',
			coverImage: input.coverImage || null,
			published: false,
			publishedAt: null,
			authorId: input.authorId ?? null,
			readingTime
		})
		.returning();
	await syncPostTags(row.id, input.tags ?? []);
	await refreshSearchIndex();
	return toDto(row, await fetchPostTags(row.id));
}

export async function updateDraftPost(input: UpdatePostInput): Promise<BlogPostDto> {
	const existing = await getDraftPost({ id: input.id });
	return updatePost(input, existing);
}

export async function updatePost(input: UpdatePostInput, knownExisting?: BlogPostDto): Promise<BlogPostDto> {
	const [existing] = knownExisting
		? await db.select().from(blogPosts).where(eq(blogPosts.id, input.id))
		: await db.select().from(blogPosts).where(eq(blogPosts.id, input.id));
	if (!existing) notFound();

	const title = {
		en: input.titleEn ?? existing.title.en,
		id: input.titleId ?? existing.title.id
	};
	const excerpt = {
		en: input.excerptEn ?? existing.excerpt.en,
		id: input.excerptId ?? existing.excerpt.id
	};
	const errors = [
		...validateTextFields(title.en, excerpt.en),
		...validateTextFields(title.id, excerpt.id)
	];
	if (input.content !== undefined) errors.push(...validateEditorJsContent(input.content).errors);
	if (input.slug !== undefined) {
		const slugError = validateSlug(input.slug);
		if (slugError) errors.push(slugError);
	}
	if (errors.length) validationError(errors);
	if (input.slug && (await findSlugConflict(input.slug, input.id))) {
		conflict(`Slug "${input.slug}" is already in use`);
	}

	const readingTime = input.content
		? await computeEditorJsReadingTime('editorjs', input.content)
		: existing.readingTime;

	await db
		.update(blogPosts)
		.set({
			slug: input.slug ?? existing.slug,
			title,
			excerpt,
			content: input.content ?? existing.content,
			contentFormat: input.content ? 'editorjs' : existing.contentFormat,
			coverImage: 'coverImage' in input ? input.coverImage || null : existing.coverImage,
			readingTime,
			updatedAt: new Date()
		})
		.where(eq(blogPosts.id, input.id));

	if (input.tags !== undefined) {
		await syncPostTags(input.id, input.tags);
		await pruneOrphanTags();
	}
	await refreshSearchIndex();
	return getPost({ id: input.id });
}

export async function publishPost(id: number): Promise<BlogPostDto> {
	const [row] = await db
		.update(blogPosts)
		.set({ published: true, publishedAt: new Date(), updatedAt: new Date() })
		.where(eq(blogPosts.id, id))
		.returning();
	if (!row) notFound();
	await refreshSearchIndex();
	return toDto(row, await fetchPostTags(id));
}

export async function unpublishPost(id: number): Promise<BlogPostDto> {
	const [row] = await db
		.update(blogPosts)
		.set({ published: false, publishedAt: null, updatedAt: new Date() })
		.where(eq(blogPosts.id, id))
		.returning();
	if (!row) notFound();
	await refreshSearchIndex();
	return toDto(row, await fetchPostTags(id));
}

export async function deletePost(id: number): Promise<void> {
	const [row] = await db.delete(blogPosts).where(eq(blogPosts.id, id)).returning({ id: blogPosts.id });
	if (!row) notFound();
	await pruneOrphanTags();
	await refreshSearchIndex();
}
