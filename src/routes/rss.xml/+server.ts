import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { blogPosts } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { loadSite } from '$lib/server/content';

const escape = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

export const GET: RequestHandler = async () => {
	const site = await loadSite();
	const posts = await db
		.select({
			slug: blogPosts.slug,
			title: blogPosts.title,
			excerpt: blogPosts.excerpt,
			publishedAt: blogPosts.publishedAt
		})
		.from(blogPosts)
		.where(eq(blogPosts.published, true))
		.orderBy(desc(blogPosts.publishedAt))
		.limit(20);

	const baseUrl = site.baseUrl.replace(/\/$/, '');
	const buildDate = new Date().toUTCString();

	const items = posts
		.map((p) => {
			const url = `${baseUrl}/blog/${p.slug}`;
			const pubDate = (p.publishedAt ?? new Date()).toUTCString();
			return `    <item>
      <title>${escape(p.title.en)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(p.excerpt.en)}</description>
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(site.siteName)} — Blog</title>
    <link>${escape(baseUrl)}/blog</link>
    <atom:link href="${escape(baseUrl)}/rss.xml" rel="self" type="application/rss+xml" />
    <description>Notes on backend systems, infrastructure, and software craft.</description>
    <language>en</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600, stale-while-revalidate=86400'
		}
	});
};
