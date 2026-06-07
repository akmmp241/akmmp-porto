import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { blogPosts } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { loadSite } from '$lib/server/content';
import { withLocale } from '$lib/seo';
import type { LangCode } from '$lib/i18n';

const escape = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

const SUPPORTED: LangCode[] = ['en', 'id'];

export const GET: RequestHandler = async ({ url }) => {
	const langParam = url.searchParams.get('lang');
	const lang: LangCode = SUPPORTED.includes(langParam as LangCode) ? (langParam as LangCode) : 'en';

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

	const channelTitle =
		lang === 'id' ? `${site.siteName} — Blog (Indonesia)` : `${site.siteName} — Blog`;
	const channelDesc =
		lang === 'id'
			? 'Catatan tentang backend, infrastruktur, dan rekayasa perangkat lunak.'
			: 'Notes on backend systems, infrastructure, and software craft.';

	const alternateLinks = SUPPORTED.filter((l) => l !== lang)
		.map(
			(l) =>
				`    <atom:link href="${escape(baseUrl)}/rss.xml?lang=${l}" rel="alternate" hreflang="${l}" type="application/rss+xml" />`
		)
		.join('\n');

	const items = posts
		.map((p) => {
			const url = `${baseUrl}${withLocale(`/blog/${p.slug}`, lang)}`;
			const pubDate = (p.publishedAt ?? new Date()).toUTCString();
			const title = p.title[lang] ?? p.title.en;
			const desc = p.excerpt[lang] ?? p.excerpt.en;
			return `    <item>
      <title>${escape(title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escape(desc)}</description>
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(channelTitle)}</title>
    <link>${escape(baseUrl)}${withLocale('/blog', lang)}</link>
    <atom:link href="${escape(baseUrl)}/rss.xml${lang === 'en' ? '' : `?lang=${lang}`}" rel="self" type="application/rss+xml" />
${alternateLinks}
    <description>${escape(channelDesc)}</description>
    <language>${lang}</language>
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
