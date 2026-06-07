/**
 * Postgres full-text search helpers.
 *
 * Queries the `search_index` materialized view created by
 * drizzle/0002_search_index_mv.sql, ranks results, and generates
 * highlighted snippets via ts_headline.
 *
 * The MV must be refreshed via refreshSearchIndex() whenever blog posts
 * or projects are mutated (publish, edit, delete, case-study save).
 */
import { sql } from 'drizzle-orm';
import { db } from './db';

export type SearchType = 'all' | 'post' | 'project';
export type SearchLang = 'en' | 'id';

export interface SearchResult {
	type: 'post' | 'project';
	id: number;
	slug: string;
	title: string;
	excerpt: string;
	snippet: string;
	coverImage: string | null;
	rank: number;
}

/**
 * Refresh the search index materialized view.
 * Uses CONCURRENTLY for non-blocking refresh (requires unique index).
 * Falls back to a plain refresh if the MV has never been populated.
 */
export async function refreshSearchIndex(): Promise<void> {
	try {
		await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY search_index`);
	} catch {
		try {
			await db.execute(sql`REFRESH MATERIALIZED VIEW search_index`);
		} catch {
			// MV may not exist yet (migration not run); silently ignore.
		}
	}
}

/**
 * Run a full-text search and return ranked results with highlighted snippets.
 *
 * @param query   user input (already trimmed)
 * @param lang    'en' or 'id' — selects the english / simple tsvector
 * @param type    filter: 'all' | 'post' | 'project'
 * @param limit   max rows to return (default 30)
 */
export async function search(
	query: string,
	lang: SearchLang = 'en',
	type: SearchType = 'all',
	limit = 30
): Promise<SearchResult[]> {
	const q = query.trim();
	if (!q) return [];

	const tsConfig = lang === 'en' ? 'english' : 'simple';
	const tsvCol = lang === 'en' ? sql.raw('tsv_en') : sql.raw('tsv_id');
	const titleCol = lang === 'en' ? sql.raw('title_en') : sql.raw('title_id');
	const excerptCol = lang === 'en' ? sql.raw('excerpt_en') : sql.raw('excerpt_id');
	const contentCol = lang === 'en' ? sql.raw('content_en') : sql.raw('content_id');

	const typeFilter =
		type === 'all'
			? sql``
			: type === 'post'
				? sql`AND type = 'post'`
				: sql`AND type = 'project'`;

	const rows = await db.execute<{
		type: 'post' | 'project';
		id: number;
		slug: string;
		title: string;
		excerpt: string;
		snippet: string;
		cover_image: string | null;
		rank: number;
	}>(sql`
		SELECT
			type,
			id,
			slug,
			${titleCol} AS title,
			${excerptCol} AS excerpt,
			ts_headline(
				${sql.raw(`'${tsConfig}'`)},
				coalesce(${contentCol}, ''),
				plainto_tsquery(${sql.raw(`'${tsConfig}'`)}, ${q}),
				'StartSel=<mark>,StopSel=</mark>,MaxWords=30,MinWords=15,ShortWord=2,MaxFragments=2'
			) AS snippet,
			cover_image,
			ts_rank(${tsvCol}, plainto_tsquery(${sql.raw(`'${tsConfig}'`)}, ${q})) AS rank
		FROM search_index
		WHERE ${tsvCol} @@ plainto_tsquery(${sql.raw(`'${tsConfig}'`)}, ${q})
		${typeFilter}
		ORDER BY rank DESC, sort_at DESC NULLS LAST
		LIMIT ${limit}
	`);

	const list: SearchResult[] = [];
	// drizzle's execute returns either an array (postgres-js) or { rows } (node-postgres).
	const data = Array.isArray(rows) ? rows : ((rows as unknown as { rows: typeof rows }).rows ?? []);
	for (const r of data as unknown as Array<{
		type: 'post' | 'project';
		id: number;
		slug: string;
		title: string;
		excerpt: string;
		snippet: string;
		cover_image: string | null;
		rank: number;
	}>) {
		list.push({
			type: r.type,
			id: r.id,
			slug: r.slug,
			title: r.title ?? '',
			excerpt: r.excerpt ?? '',
			snippet: r.snippet ?? '',
			coverImage: r.cover_image,
			rank: Number(r.rank ?? 0)
		});
	}
	return list;
}
