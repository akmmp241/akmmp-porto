/**
 * SEO helpers — single source of truth for meta tags, canonical URLs,
 * hreflang alternates, and JSON-LD structured data.
 *
 * Usage in a Svelte component:
 *   import { buildMeta, articleJsonLd } from '$lib/seo';
 *   const meta = buildMeta({ url: page.url, lang, site, title, description });
 */
import type { Site } from './data/schemas';
import type { LangCode } from './i18n';
import { locales as ALL_LOCALES } from './paraglide/runtime.js';

export const SUPPORTED_LOCALES = ALL_LOCALES as readonly LangCode[];

export interface BuildMetaInput {
	/** Current page URL (use SvelteKit's `page.url`). */
	url: URL;
	lang: LangCode;
	site: Site;
	title: string;
	description: string;
	/** Image — relative or absolute. Falls back to site.ogImage. */
	image?: string | null;
	/** og:type — defaults to "website". */
	type?: 'website' | 'article' | 'profile';
	/** Whether to noindex this page. */
	noindex?: boolean;
	/** ISO datetime for articles. */
	publishedTime?: string | null;
	/** ISO datetime for articles. */
	modifiedTime?: string | null;
	/** Article tags. */
	tags?: string[];
	/** Article author. */
	author?: string | null;
}

export interface BuiltMeta {
	title: string;
	description: string;
	canonical: string;
	ogImage: string;
	ogLocale: string;
	ogType: 'website' | 'article' | 'profile';
	siteName: string;
	twitterCard: 'summary' | 'summary_large_image';
	noindex: boolean;
	publishedTime?: string | null;
	modifiedTime?: string | null;
	tags?: string[];
	author?: string | null;
	/** rel=alternate links for every supported locale + x-default. */
	alternates: { hreflang: string; href: string }[];
}

const LOCALE_OG_MAP: Record<LangCode, string> = {
	en: 'en_US',
	id: 'id_ID'
};

const LOCALE_DEFAULT: LangCode = 'en';

/** Strip a leading locale segment (`/id/foo` → `/foo`, `/en` → `/`). */
export function stripLocaleSegment(pathname: string): string {
	for (const loc of SUPPORTED_LOCALES) {
		if (loc === LOCALE_DEFAULT) continue;
		if (pathname === `/${loc}`) return '/';
		if (pathname.startsWith(`/${loc}/`)) return pathname.slice(loc.length + 1);
	}
	return pathname;
}

/** Prepend a locale prefix (en stays bare, id gets `/id`). */
export function withLocale(pathname: string, lang: LangCode): string {
	const clean = pathname.startsWith('/') ? pathname : `/${pathname}`;
	if (lang === LOCALE_DEFAULT) return clean;
	return clean === '/' ? `/${lang}` : `/${lang}${clean}`;
}

/** Make a relative URL absolute against site.baseUrl. */
export function absoluteUrl(maybeUrl: string, baseUrl: string): string {
	if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
	const base = baseUrl.replace(/\/$/, '');
	const path = maybeUrl.startsWith('/') ? maybeUrl : `/${maybeUrl}`;
	return `${base}${path}`;
}

export function buildMeta(input: BuildMetaInput): BuiltMeta {
	const { url, lang, site } = input;
	const baseUrl = site.baseUrl.replace(/\/$/, '');
	const bareSegment = stripLocaleSegment(url.pathname);
	const canonicalPath = withLocale(bareSegment, lang);
	const canonical = `${baseUrl}${canonicalPath}`;

	const alternates = SUPPORTED_LOCALES.map((loc) => ({
		hreflang: loc,
		href: `${baseUrl}${withLocale(bareSegment, loc)}`
	}));
	alternates.push({
		hreflang: 'x-default',
		href: `${baseUrl}${withLocale(bareSegment, LOCALE_DEFAULT)}`
	});

	const ogImage = absoluteUrl(input.image || site.ogImage, baseUrl);

	return {
		title: input.title,
		description: input.description,
		canonical,
		ogImage,
		ogLocale: LOCALE_OG_MAP[lang],
		ogType: input.type ?? 'website',
		siteName: site.siteName,
		twitterCard: 'summary_large_image',
		noindex: input.noindex ?? false,
		publishedTime: input.publishedTime ?? null,
		modifiedTime: input.modifiedTime ?? null,
		tags: input.tags,
		author: input.author ?? null,
		alternates
	};
}

// ───── JSON-LD builders ──────────────────────────────────────────────────

export function personJsonLd(site: Site, sameAs: string[] = []): object {
	const baseUrl = site.baseUrl.replace(/\/$/, '');
	return {
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: site.owner,
		url: baseUrl,
		image: absoluteUrl(site.ogImage, baseUrl),
		jobTitle: 'Software Engineer',
		sameAs: sameAs.length ? sameAs : undefined
	};
}

export function websiteJsonLd(site: Site): object {
	const baseUrl = site.baseUrl.replace(/\/$/, '');
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: site.siteName,
		url: baseUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${baseUrl}/search?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	};
}

export interface ArticleLdInput {
	site: Site;
	headline: string;
	description: string;
	url: string;
	image?: string | null;
	datePublished?: string | null;
	dateModified?: string | null;
	author?: string | null;
	tags?: string[];
	wordCount?: number;
	timeRequiredMinutes?: number;
}

export function articleJsonLd(input: ArticleLdInput): object {
	const baseUrl = input.site.baseUrl.replace(/\/$/, '');
	const image = input.image ? absoluteUrl(input.image, baseUrl) : absoluteUrl(input.site.ogImage, baseUrl);
	return {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: input.headline,
		description: input.description,
		image,
		mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
		url: input.url,
		datePublished: input.datePublished ?? undefined,
		dateModified: input.dateModified ?? input.datePublished ?? undefined,
		author: input.author
			? { '@type': 'Person', name: input.author }
			: { '@type': 'Person', name: input.site.owner },
		publisher: { '@type': 'Person', name: input.site.owner },
		keywords: input.tags?.length ? input.tags.join(', ') : undefined,
		wordCount: input.wordCount,
		timeRequired: input.timeRequiredMinutes ? `PT${input.timeRequiredMinutes}M` : undefined
	};
}

export interface CreativeWorkLdInput {
	site: Site;
	name: string;
	description: string;
	url: string;
	image?: string | null;
	keywords?: string[];
}

export function creativeWorkJsonLd(input: CreativeWorkLdInput): object {
	const baseUrl = input.site.baseUrl.replace(/\/$/, '');
	const image = input.image ? absoluteUrl(input.image, baseUrl) : undefined;
	return {
		'@context': 'https://schema.org',
		'@type': 'CreativeWork',
		name: input.name,
		description: input.description,
		image,
		url: input.url,
		keywords: input.keywords?.length ? input.keywords.join(', ') : undefined,
		creator: { '@type': 'Person', name: input.site.owner }
	};
}

export interface BreadcrumbItem {
	name: string;
	url: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): object {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((it, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: it.name,
			item: it.url
		}))
	};
}

/** Stringify JSON-LD safely for embedding in <script> (escapes `</`). */
export function jsonLdScript(data: object): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
