<script lang="ts">
	import { Clock, Tag } from '@lucide/svelte';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import TiltCard from '$lib/components/fx/tilt-card.svelte';
	import { tr, type LangCode } from '$lib/i18n';
	import { cn } from '$lib/utils/cn';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	function fmt(d: Date | string | null) {
		if (!d) return '';
		return new Date(d).toLocaleDateString(data.lang === 'id' ? 'id-ID' : 'en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Blog · Akmal MP</title>
	<meta name="description" content="Notes on backend systems, infrastructure, and software craft." />
	<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="Akmal MP — Blog" />
</svelte:head>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>blog</SectionHeading>
	<p class="text-muted-foreground max-w-2xl">
		{#if data.lang === 'id'}
			Catatan tentang backend, infrastruktur, dan rekayasa perangkat lunak.
		{:else}
			Notes on backend systems, infrastructure, and software craft.
		{/if}
	</p>

	{#if data.tags.length > 0}
		<div class="flex flex-wrap gap-2 bg-muted/20 border border-border/20 p-3 rounded-2xl">
			<a
				href={localizeHref('/blog')}
				class="bg-primary/10 border border-primary/30 text-primary shadow-sm shadow-primary/5 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all"
			>
				All
			</a>
			{#each data.tags as tag (tag.id)}
				<a
					href={localizeHref(`/blog/tag/${tag.slug}`)}
					class="bg-secondary/35 border border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60 inline-flex items-center gap-1 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide transition-all"
				>
					<Tag class="h-3 w-3" /> {tag.name}
				</a>
			{/each}
		</div>
	{/if}

	{#if data.posts.length === 0}
		<div class="rounded-xl border border-border bg-card/30 p-12 text-center text-muted-foreground">
			No posts yet. Check back soon.
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each data.posts as post, i (post.id)}
				<Reveal delay={i * 60}>
					<TiltCard class="block h-full">
						<a
							href={localizeHref(`/blog/${post.slug}`)}
							class="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/15 hover:border-primary/45 transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5"
						>
							{#if post.coverImage}
								<div class="aspect-[16/9] overflow-hidden relative">
									<img
										src={post.coverImage}
										alt={tr(post.title, data.lang)}
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-background/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
							{/if}
							<div class="flex flex-1 flex-col gap-3 p-5">
								<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<time class="font-medium">{fmt(post.publishedAt)}</time>
									<span class="opacity-30">·</span>
									<span class="inline-flex items-center gap-1">
										<Clock class="h-3 w-3" /> {post.readingTime} min
									</span>
								</div>
								<h2 class="text-lg font-bold leading-snug tracking-tight text-foreground/90 group-hover:text-primary transition-colors duration-200">
									{tr(post.title, data.lang)}
								</h2>
								<p class="text-sm text-muted-foreground leading-relaxed line-clamp-3">
									{tr(post.excerpt, data.lang)}
								</p>
								{#if post.tags.length > 0}
									<div class="mt-auto flex flex-wrap gap-1.5 pt-3 border-t border-border/20">
										{#each post.tags as tag (tag.slug)}
											<span class="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
												#{tag.name}
											</span>
										{/each}
									</div>
								{/if}
							</div>
						</a>
					</TiltCard>
				</Reveal>
			{/each}
		</div>

		{#if data.totalPages > 1}
			<nav class="flex items-center justify-center gap-2 pt-4" aria-label="Pagination">
				{#each Array(data.totalPages) as _, i}
					{@const n = i + 1}
					<a
						href={localizeHref(`/blog?page=${n}`)}
						class={cn(
							'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors',
							n === data.page
								? 'border-primary bg-primary/10 text-primary'
								: 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
						)}
					>
						{n}
					</a>
				{/each}
			</nav>
		{/if}
	{/if}
</section>
