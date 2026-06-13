import { sql } from 'drizzle-orm';
import {
	pgTable,
	text,
	timestamp,
	serial,
	integer,
	boolean,
	jsonb,
	primaryKey,
	date,
	interval,
	index
} from 'drizzle-orm/pg-core';

// ───── Auth ──────────────────────────────────────────────────────────────────

export const authUser = pgTable('auth_user', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	name: text('name'),
	role: text('role').notNull().default('admin'),
	hashedPassword: text('hashed_password').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const authSession = pgTable('auth_session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => authUser.id, { onDelete: 'cascade' }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

export type AuthUser = typeof authUser.$inferSelect;
export type AuthSession = typeof authSession.$inferSelect;

// ───── Content ───────────────────────────────────────────────────────────────

export const projects = pgTable('projects', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	description: jsonb('description').notNull().$type<{ en: string; id: string }>(),
	techstack: text('techstack')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	image: text('image'),
	badges: jsonb('badges')
		.notNull()
		.default(sql`'{}'::jsonb`)
		.$type<{ fe?: string; be?: string; live?: string }>(),
	featured: boolean('featured').notNull().default(false),
	order: integer('order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const experiences = pgTable('experiences', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	company: text('company').notNull(),
	location: text('location'),
	startDate: text('start_date').notNull(),
	endDate: text('end_date'),
	current: boolean('current').notNull().default(false),
	description: jsonb('description').notNull().$type<{ en: string; id: string }>(),
	skills: text('skills')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	type: text('type', { enum: ['work', 'education', 'intern', 'project'] }).notNull(),
	order: integer('order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const skillGroups = pgTable('skill_groups', {
	id: serial('id').primaryKey(),
	title: jsonb('title').notNull().$type<{ en: string; id: string }>(),
	items: text('items')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	order: integer('order').notNull().default(0)
});

export const siteSettings = pgTable('site_settings', {
	key: text('key').primaryKey(),
	value: jsonb('value').notNull()
});

export type ProjectRow = typeof projects.$inferSelect;
export type ExperienceRow = typeof experiences.$inferSelect;
export type SkillGroupRow = typeof skillGroups.$inferSelect;
export type SiteSettingRow = typeof siteSettings.$inferSelect;

// ───── Blog ───────────────────────────────────────────────────────────

export const blogPosts = pgTable('blog_posts', {
	id: serial('id').primaryKey(),
	slug: text('slug').notNull().unique(),
	title: jsonb('title').notNull().$type<{ en: string; id: string }>(),
	excerpt: jsonb('excerpt').notNull().$type<{ en: string; id: string }>(),
	content: jsonb('content').notNull().$type<string>(),
	contentFormat: text('content_format').notNull().default('markdown'),
	coverImage: text('cover_image'),
	published: boolean('published').notNull().default(false),
	publishedAt: timestamp('published_at', { withTimezone: true }),
	authorId: text('author_id').references(() => authUser.id, { onDelete: 'set null' }),
	readingTime: integer('reading_time').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const tags = pgTable('tags', {
	id: serial('id').primaryKey(),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique()
});

export const blogPostTags = pgTable(
	'blog_post_tags',
	{
		postId: integer('post_id')
			.notNull()
			.references(() => blogPosts.id, { onDelete: 'cascade' }),
		tagId: integer('tag_id')
			.notNull()
			.references(() => tags.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

export const projectCaseStudies = pgTable('project_case_studies', {
	projectId: integer('project_id')
		.primaryKey()
		.references(() => projects.id, { onDelete: 'cascade' }),
	content: jsonb('content').notNull().$type<{ en: string; id: string }>(),
	gallery: text('gallery')
		.array()
		.notNull()
		.default(sql`ARRAY[]::text[]`),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export type BlogPostRow = typeof blogPosts.$inferSelect;
export type TagRow = typeof tags.$inferSelect;
export type ProjectCaseStudyRow = typeof projectCaseStudies.$inferSelect;

// ───── Engagement ────────────────────────────────────────────────────────────

export const contactMessages = pgTable('contact_messages', {
	id: serial('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	subject: text('subject'),
	message: text('message').notNull(),
	ipAddress: text('ip_address'),
	read: boolean('read').default(false).notNull(),
	archived: boolean('archived').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const guestbookEntries = pgTable('guestbook_entries', {
	id: serial('id').primaryKey(),
	author: text('author').notNull(),
	message: text('message').notNull(),
	ipAddress: text('ip_address'),
	approved: boolean('approved').default(false).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const rateLimits = pgTable('rate_limits', {
	key: text('key').primaryKey(),
	tokens: integer('tokens').notNull(),
	lastReset: timestamp('last_reset', { withTimezone: true }).notNull()
});

export const auditLog = pgTable('audit_log', {
	id: serial('id').primaryKey(),
	userId: text('user_id').references(() => authUser.id, { onDelete: 'set null' }),
	action: text('action').notNull(),
	target: text('target'),
	metadata: jsonb('metadata').default(sql`'{}'::jsonb`).notNull(),
	ipAddress: text('ip_address'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type ContactMessageRow = typeof contactMessages.$inferSelect;
export type GuestbookEntryRow = typeof guestbookEntries.$inferSelect;
export type RateLimitRow = typeof rateLimits.$inferSelect;
export type AuditLogRow = typeof auditLog.$inferSelect;

// ───── Analytics ─────────────────────────────────────────────────────────────

/**
 * Raw page view events. No PII stored:
 *  - IP addresses are NOT stored (only country derived from IP, currently null)
 *  - session_id is a one-way SHA-256 hash of (IP + UA + date), resets daily
 */
export const pageViews = pgTable(
	'page_views',
	{
		id: serial('id').primaryKey(),
		path: text('path').notNull(),
		referrer: text('referrer'),
		userAgent: text('user_agent'),
		country: text('country'), // 2-letter ISO code, derived from IP (not stored)
		deviceType: text('device_type'), // 'desktop' | 'mobile' | 'tablet'
		browser: text('browser'),
		os: text('os'),
		sessionId: text('session_id'), // anonymous daily hash, not re-identifiable
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
	},
	(t) => [
		index('idx_pv_path').on(t.path),
		index('idx_pv_created_at').on(t.createdAt),
		index('idx_pv_session').on(t.sessionId)
	]
);

/** Pre-aggregated daily views per path — fast dashboard queries. */
export const dailyStats = pgTable(
	'daily_stats',
	{
		date: date('date').notNull(),
		path: text('path').notNull(),
		views: integer('views').default(0).notNull(),
		uniqueViews: integer('unique_views').default(0).notNull()
	},
	(t) => [primaryKey({ columns: [t.date, t.path] })]
);

/** Pre-aggregated daily referrer counts. */
export const referrerStats = pgTable(
	'referrer_stats',
	{
		date: date('date').notNull(),
		referrer: text('referrer').notNull(),
		count: integer('count').default(0).notNull()
	},
	(t) => [primaryKey({ columns: [t.date, t.referrer] })]
);

/** Pre-aggregated daily country visit counts. */
export const geoStats = pgTable(
	'geo_stats',
	{
		date: date('date').notNull(),
		country: text('country').notNull(),
		count: integer('count').default(0).notNull()
	},
	(t) => [primaryKey({ columns: [t.date, t.country] })]
);

/** Pre-aggregated daily device + browser breakdown. */
export const deviceStats = pgTable(
	'device_stats',
	{
		date: date('date').notNull(),
		deviceType: text('device_type').notNull(),
		browser: text('browser').notNull(),
		count: integer('count').default(0).notNull()
	},
	(t) => [primaryKey({ columns: [t.date, t.deviceType, t.browser] })]
);

export type PageViewRow = typeof pageViews.$inferSelect;
export type DailyStatRow = typeof dailyStats.$inferSelect;
export type ReferrerStatRow = typeof referrerStats.$inferSelect;
export type GeoStatRow = typeof geoStats.$inferSelect;
export type DeviceStatRow = typeof deviceStats.$inferSelect;

// ───── GitHub Cache ───────────────────────────────────────────────────────────

/**
 * DB-backed cache for GitHub API responses.
 * TTL-based refresh: if fetched_at + ttl < now(), the record is stale.
 * key examples: 'profile', 'repos', 'contributions'
 */
export const githubCache = pgTable('github_cache', {
	key: text('key').primaryKey(),
	data: jsonb('data').notNull(),
	fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull(),
	ttl: interval('ttl').notNull() // e.g. '1 hour', '6 hours', '12 hours'
});

export type GitHubCacheRow = typeof githubCache.$inferSelect;

