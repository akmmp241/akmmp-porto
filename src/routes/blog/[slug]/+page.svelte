<script lang="ts">
	import { Clock, Calendar, ArrowLeft, Tag } from '@lucide/svelte';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { tr, type LangCode } from '$lib/i18n';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import ReadingProgress from '$lib/components/fx/reading-progress.svelte';
	import Toc from '$lib/components/fx/toc.svelte';
	import ProseEnhancer from '$lib/components/fx/prose-enhancer.svelte';
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
</script>

<svelte:head>
	<title>{title} · Akmal MP</title>
	<meta name="description" content={excerpt} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={excerpt} />
	{#if data.post.coverImage}
		<meta property="og:image" content={data.post.coverImage} />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="Akmal MP — Blog" />
</svelte:head>

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
