import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { blogPosts, projects as projectsTable, tags as tagsTable } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { loadSite } from '$lib/server/content';
import { SUPPORTED_LOCALES, withLocale } from '$lib/seo';

const escape = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const STATIC_PATHS: { path: string; changefreq: string; priority: string }[] = [
	{ path: '/', changefreq: 'weekly', priority: '1.0' },
	{ path: '/about', changefreq: 'monthly', priority: '0.8' },
	{ path: '/projects', changefreq: 'weekly', priority: '0.9' },
	{ path: '/blog', changefreq: 'daily', priority: '0.9' },
	{ path: '/contact', changefreq: 'yearly', priority: '0.5' },
	{ path: '/guestbook', changefreq: 'weekly', priority: '0.5' },
	{ path: '/search', changefreq: 'monthly', priority: '0.3' }
];

interface Entry {
	path: string;
	lastmod?: Date | null;
	changefreq: string;
	priority: string;
}

function urlBlock(entry: Entry, baseUrl: string): string {
	const alternates = SUPPORTED_LOCALES.map(
		(loc) =>
			`    <xhtml:link rel="alternate" hreflang="${loc}" href="${escape(
				baseUrl + withLocale(entry.path, loc)
			)}" />`
	).join('\n');
	const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(
		baseUrl + withLocale(entry.path, 'en')
	)}" />`;

	return SUPPORTED_LOCALES.map((loc) => {
		const loc_url = baseUrl + withLocale(entry.path, loc);
		const lastmod = entry.lastmod
			? `    <lastmod>${entry.lastmod.toISOString()}</lastmod>\n`
			: '';
		return `  <url>
    <loc>${escape(loc_url)}</loc>
${lastmod}    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
${alternates}
${xDefault}
  </url>`;
	}).join('\n');
}

export const GET: RequestHandler = async () => {
	const site = await loadSite();
	const baseUrl = site.baseUrl.replace(/\/$/, '');

	const entries: Entry[] = [...STATIC_PATHS];

	try {
		const posts = await db
			.select({
				slug: blogPosts.slug,
				updatedAt: blogPosts.updatedAt,
				publishedAt: blogPosts.publishedAt
			})
			.from(blogPosts)
			.where(eq(blogPosts.published, true))
			.orderBy(desc(blogPosts.publishedAt));

		for (const p of posts) {
			entries.push({
				path: `/blog/${p.slug}`,
				lastmod: p.updatedAt ?? p.publishedAt,
				changefreq: 'monthly',
				priority: '0.7'
			});
		}

		const projects = await db
			.select({ slug: projectsTable.slug, updatedAt: projectsTable.updatedAt })
			.from(projectsTable);

		for (const p of projects) {
			entries.push({
				path: `/projects/${p.slug}`,
				lastmod: p.updatedAt,
				changefreq: 'monthly',
				priority: '0.7'
			});
		}

		const allTags = await db.select({ slug: tagsTable.slug }).from(tagsTable);
		for (const t of allTags) {
			entries.push({
				path: `/blog/tag/${t.slug}`,
				lastmod: null,
				changefreq: 'weekly',
				priority: '0.4'
			});
		}
	} catch {
		// DB unavailable — sitemap still serves static routes
	}

	const body = entries.map((e) => urlBlock(e, baseUrl)).join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400'
		}
	});
};
