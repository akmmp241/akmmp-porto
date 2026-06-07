/**
 * Server-side content loaders.
 *
 * Reads from DB when populated, falls back to static data files when DB
 * is empty (or DB module is unavailable). This lets the public pages keep
 * rendering during early-Phase-2 dev and after migrations.
 */
import { db } from './db';
import {
	projects as projectsTable,
	experiences as experiencesTable,
	skillGroups as skillGroupsTable,
	siteSettings,
	blogPosts,
	tags as tagsTable,
	blogPostTags,
	projectCaseStudies,
	authUser
} from './db/schema';
import { and, asc, eq, desc, sql, inArray } from 'drizzle-orm';
import type { Project, Experience, SkillGroup, About, Site } from '$lib/data/schemas';
import { aboutSchema, siteSchema } from '$lib/data/schemas';
import { projects as staticProjects } from '$lib/data/projects';
import { experiences as staticExperiences } from '$lib/data/experience';
import { skillGroups as staticSkillGroups } from '$lib/data/skills';
import { about as staticAbout } from '$lib/data/about';
import { site as staticSite } from '$lib/data/site';

export async function loadProjects(): Promise<Project[]> {
	try {
		const rows = await db
			.select()
			.from(projectsTable)
			.orderBy(asc(projectsTable.order), asc(projectsTable.id));
		if (rows.length === 0) return staticProjects;
		return rows.map((r) => ({
			slug: r.slug,
			title: r.title,
			description: r.description,
			techstack: r.techstack,
			image: r.image ?? undefined,
			badges: r.badges ?? {},
			featured: r.featured,
			order: r.order
		}));
	} catch {
		return staticProjects;
	}
}

export async function loadExperiences(): Promise<Experience[]> {
	try {
		const rows = await db
			.select()
			.from(experiencesTable)
			.orderBy(asc(experiencesTable.order), desc(experiencesTable.id));
		if (rows.length === 0) return staticExperiences;
		return rows.map((r) => ({
			id: String(r.id),
			title: r.title,
			company: r.company,
			location: r.location ?? undefined,
			startDate: r.startDate,
			endDate: r.endDate ?? undefined,
			current: r.current,
			description: r.description,
			skills: r.skills,
			type: r.type as Experience['type']
		}));
	} catch {
		return staticExperiences;
	}
}

export async function loadSkillGroups(): Promise<SkillGroup[]> {
	try {
		const rows = await db
			.select()
			.from(skillGroupsTable)
			.orderBy(asc(skillGroupsTable.order), asc(skillGroupsTable.id));
		if (rows.length === 0) return staticSkillGroups;
		return rows.map((r) => ({ title: r.title, items: r.items }));
	} catch {
		return staticSkillGroups;
	}
}

export async function loadAbout(): Promise<About> {
	try {
		const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'about'));
		if (!row) return staticAbout;
		return aboutSchema.parse(row.value);
	} catch {
		return staticAbout;
	}
}

export async function loadSite(): Promise<Site> {
	try {
		const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site'));
		if (!row) return staticSite;
		return siteSchema.parse(row.value);
	} catch {
		return staticSite;
	}
}

// ───── Blog ───────────────────────────────────────────────────────────

export interface BlogListItem {
	id: number;
	slug: string;
	title: { en: string; id: string };
	excerpt: { en: string; id: string };
	coverImage: string | null;
	publishedAt: Date | null;
	readingTime: number;
	tags: { name: string; slug: string }[];
}

export interface BlogPostDetail extends BlogListItem {
	content: { en: string; id: string };
	authorName: string | null;
}

export async function listPublishedPosts(opts: {
	page?: number;
	pageSize?: number;
	tagSlug?: string;
}): Promise<{ items: BlogListItem[]; total: number; page: number; pageSize: number }> {
	const page = Math.max(1, opts.page ?? 1);
	const pageSize = Math.max(1, Math.min(50, opts.pageSize ?? 10));
	const offset = (page - 1) * pageSize;

	let postIds: number[] | null = null;
	if (opts.tagSlug) {
		const [tag] = await db.select().from(tagsTable).where(eq(tagsTable.slug, opts.tagSlug));
		if (!tag) return { items: [], total: 0, page, pageSize };
		const links = await db
			.select({ postId: blogPostTags.postId })
			.from(blogPostTags)
			.where(eq(blogPostTags.tagId, tag.id));
		postIds = links.map((l) => l.postId);
		if (postIds.length === 0) return { items: [], total: 0, page, pageSize };
	}

	const whereClause = postIds
		? and(eq(blogPosts.published, true), inArray(blogPosts.id, postIds))
		: eq(blogPosts.published, true);

	const [{ c: total }] = await db
		.select({ c: sql<number>`count(*)::int` })
		.from(blogPosts)
		.where(whereClause);

	const rows = await db
		.select()
		.from(blogPosts)
		.where(whereClause)
		.orderBy(desc(blogPosts.publishedAt), desc(blogPosts.id))
		.limit(pageSize)
		.offset(offset);

	const items = await attachTagsToPosts(rows);
	return { items, total: Number(total ?? 0), page, pageSize };
}

export async function getPostBySlug(slug: string): Promise<BlogPostDetail | null> {
	const [row] = await db
		.select({
			post: blogPosts,
			authorName: authUser.name
		})
		.from(blogPosts)
		.leftJoin(authUser, eq(blogPosts.authorId, authUser.id))
		.where(eq(blogPosts.slug, slug));
	if (!row || !row.post.published) return null;
	const [withTags] = await attachTagsToPosts([row.post]);
	return {
		...withTags,
		content: row.post.content,
		authorName: row.authorName
	};
}

export async function listAllTags(): Promise<{ id: number; name: string; slug: string }[]> {
	return db.select().from(tagsTable).orderBy(asc(tagsTable.name));
}

async function attachTagsToPosts(rows: (typeof blogPosts.$inferSelect)[]): Promise<BlogListItem[]> {
	if (rows.length === 0) return [];
	const ids = rows.map((r) => r.id);
	const links = await db
		.select({
			postId: blogPostTags.postId,
			name: tagsTable.name,
			slug: tagsTable.slug
		})
		.from(blogPostTags)
		.innerJoin(tagsTable, eq(blogPostTags.tagId, tagsTable.id))
		.where(inArray(blogPostTags.postId, ids));

	const byPost = new Map<number, { name: string; slug: string }[]>();
	for (const l of links) {
		if (!byPost.has(l.postId)) byPost.set(l.postId, []);
		byPost.get(l.postId)!.push({ name: l.name, slug: l.slug });
	}

	return rows.map((r) => ({
		id: r.id,
		slug: r.slug,
		title: r.title,
		excerpt: r.excerpt,
		coverImage: r.coverImage,
		publishedAt: r.publishedAt,
		readingTime: r.readingTime,
		tags: byPost.get(r.id) ?? []
	}));
}

// ───── Project case studies ──────────────────────────────────────────

export interface ProjectDetail extends Project {
	id: number;
	caseStudy: { en: string; id: string } | null;
	gallery: string[];
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
	const [row] = await db
		.select()
		.from(projectsTable)
		.where(eq(projectsTable.slug, slug));
	if (!row) return null;
	const [cs] = await db
		.select()
		.from(projectCaseStudies)
		.where(eq(projectCaseStudies.projectId, row.id));
	return {
		id: row.id,
		slug: row.slug,
		title: row.title,
		description: row.description,
		techstack: row.techstack,
		image: row.image ?? undefined,
		badges: row.badges ?? {},
		featured: row.featured,
		order: row.order,
		caseStudy: cs?.content ?? null,
		gallery: cs?.gallery ?? []
	};
}

export async function getRelatedProjects(
	currentId: number,
	limit = 3
): Promise<Project[]> {
	const rows = await db
		.select()
		.from(projectsTable)
		.where(sql`${projectsTable.id} <> ${currentId}`)
		.orderBy(asc(projectsTable.order), asc(projectsTable.id))
		.limit(limit);
	return rows.map((r) => ({
		slug: r.slug,
		title: r.title,
		description: r.description,
		techstack: r.techstack,
		image: r.image ?? undefined,
		badges: r.badges ?? {},
		featured: r.featured,
		order: r.order
	}));
}
