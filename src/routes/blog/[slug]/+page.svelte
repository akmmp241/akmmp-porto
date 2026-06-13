<script lang="ts">
	import { Clock, Calendar, ArrowLeft, Tag } from '@lucide/svelte';
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { tr, type LangCode } from '$lib/i18n';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import ReadingProgress from '$lib/components/fx/reading-progress.svelte';
	import Toc from '$lib/components/fx/toc.svelte';
	import ProseEnhancer from '$lib/components/fx/prose-enhancer.svelte';
	import SeoHead from '$lib/components/seo/seo-head.svelte';
	import { buildMeta, articleJsonLd, breadcrumbJsonLd, absoluteUrl } from '$lib/seo';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	let proseEl: HTMLElement | undefined = $state();

	function fmt(d: Date | string | null) {
		if (!d) return '';
		return new Date(d).toLocaleDateString(data.lang === 'id' ? 'id-ID' : 'en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const title = $derived(tr(data.post.title, data.lang));
	const excerpt = $derived(tr(data.post.excerpt, data.lang));
	const tagNames = $derived(data.post.tags.map((t) => t.name));
	const wordCount = $derived(
		data.html
			.replace(/<[^>]*>/g, ' ')
			.split(/\s+/)
			.filter(Boolean).length
	);

	const meta = $derived(
		buildMeta({
			url: page.url,
			lang: data.lang,
			site: page.data.site,
			title: `${title} · ${page.data.site.owner}`,
			description: excerpt,
			image:
				data.post.coverImage ??
				`/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(excerpt.slice(0, 80))}&kind=blog`,
			type: 'article',
			publishedTime: data.post.publishedAt
				? new Date(data.post.publishedAt).toISOString()
				: null,
			tags: tagNames,
			author: data.post.authorName ?? page.data.site.owner
		})
	);

	const baseUrl = $derived(page.data.site.baseUrl.replace(/\/$/, ''));
	const ld = $derived([
		articleJsonLd({
			site: page.data.site,
			headline: title,
			description: excerpt,
			url: meta.canonical,
			image: data.post.coverImage,
			datePublished: data.post.publishedAt
				? new Date(data.post.publishedAt).toISOString()
				: null,
			author: data.post.authorName ?? page.data.site.owner,
			tags: tagNames,
			wordCount,
			timeRequiredMinutes: data.readingTimeMinutes
		}),
		breadcrumbJsonLd([
			{ name: 'Home', url: absoluteUrl('/', baseUrl) },
			{ name: 'Blog', url: absoluteUrl('/blog', baseUrl) },
			{ name: title, url: meta.canonical }
		])
	]);
</script>

<SeoHead {meta} jsonLd={ld} />

<ReadingProgress />

<article class="px-6 lg:p-0">
	<div class="grid gap-12 xl:grid-cols-[1fr_220px]">
		<div>
			<a
				href={localizeHref('/blog')}
				class="mb-8 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft class="h-4 w-4" /> Back to blog
			</a>

			<header class="mb-10 flex flex-col gap-4">
				<Reveal>
					<h1 class="text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
				</Reveal>
				<Reveal delay={80}>
					<p class="text-lg text-muted-foreground">{excerpt}</p>
				</Reveal>
				<Reveal delay={140}>
					<div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						{#if data.post.publishedAt}
							<span class="inline-flex items-center gap-1.5">
								<Calendar class="h-3.5 w-3.5" /> {fmt(data.post.publishedAt)}
							</span>
						{/if}
						<span class="opacity-30">·</span>
						<span class="inline-flex items-center gap-1.5">
							<Clock class="h-3.5 w-3.5" /> {data.readingTimeMinutes} min read
						</span>
						{#if data.post.authorName}
							<span class="opacity-30">·</span>
							<span>by {data.post.authorName}</span>
						{/if}
					</div>
				</Reveal>
				{#if data.post.tags.length > 0}
					<Reveal delay={200}>
						<div class="flex flex-wrap gap-1.5">
							{#each data.post.tags as tag (tag.slug)}
								<a
									href={localizeHref(`/blog/tag/${tag.slug}`)}
									class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary transition-colors hover:bg-primary/20"
								>
									<Tag class="h-3 w-3" />{tag.name}
								</a>
							{/each}
						</div>
					</Reveal>
				{/if}
			</header>

			{#if data.post.coverImage}
				<Reveal delay={240}>
					<img
						src={data.post.coverImage}
						alt={title}
						class="mb-10 w-full rounded-xl border border-border object-cover"
					/>
				</Reveal>
			{/if}

			<div bind:this={proseEl} class="prose-portfolio">
				{@html data.html}
			</div>

			<ProseEnhancer target={proseEl} />

			<footer class="mt-16 border-t border-border pt-8">
				<div class="flex items-center justify-between text-sm text-muted-foreground">
					<a href={localizeHref('/blog')} class="inline-flex items-center gap-1.5 hover:text-foreground">
						<ArrowLeft class="h-4 w-4" /> All posts
					</a>
					<span class="text-xs">Last updated · {fmt(data.post.publishedAt)}</span>
				</div>
			</footer>
		</div>

		<Toc entries={data.toc} />
	</div>
</article>
