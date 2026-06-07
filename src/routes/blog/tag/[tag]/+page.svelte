<script lang="ts">
	import { Clock, Tag, ArrowLeft } from '@lucide/svelte';
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import TiltCard from '$lib/components/fx/tilt-card.svelte';
	import SeoHead from '$lib/components/seo/seo-head.svelte';
	import { buildMeta } from '$lib/seo';
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

	const meta = $derived(
		buildMeta({
			url: page.url,
			lang: data.lang,
			site: page.data.site,
			title: `#${data.tag.name} · Blog · ${page.data.site.owner}`,
			description:
				data.lang === 'id'
					? `Posting blog dengan tag #${data.tag.name}.`
					: `Blog posts tagged #${data.tag.name}.`
		})
	);
</script>

<SeoHead {meta} />

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<a
		href={localizeHref('/blog')}
		class="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<ArrowLeft class="h-4 w-4" /> All posts
	</a>
	<SectionHeading>
		<span class="inline-flex items-center gap-2"><Tag class="h-5 w-5" /> {data.tag.name}</span>
	</SectionHeading>
	<p class="text-muted-foreground">
		{data.total} {data.total === 1 ? 'post' : 'posts'} tagged <span class="text-primary">#{data.tag.name}</span>.
	</p>

	{#if data.posts.length === 0}
		<div class="rounded-xl border border-border bg-card/30 p-12 text-center text-muted-foreground">
			No posts here yet.
		</div>
	{:else}
		<div class="grid gap-6 md:grid-cols-2">
			{#each data.posts as post, i (post.id)}
				<Reveal delay={i * 60}>
					<TiltCard class="block h-full">
						<a
							href={localizeHref(`/blog/${post.slug}`)}
							class="group flex h-full flex-col overflow-hidden rounded-xl border-2 border-muted-foreground/40 bg-card/40 transition-all hover:border-primary"
						>
							{#if post.coverImage}
								<div class="aspect-[16/9] overflow-hidden">
									<img
										src={post.coverImage}
										alt={tr(post.title, data.lang)}
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
								</div>
							{/if}
							<div class="flex flex-1 flex-col gap-3 p-5">
								<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<time>{fmt(post.publishedAt)}</time>
									<span class="opacity-30">·</span>
									<span class="inline-flex items-center gap-1">
										<Clock class="h-3 w-3" /> {post.readingTime} min
									</span>
								</div>
								<h2 class="text-lg font-semibold leading-snug tracking-tight">
									{tr(post.title, data.lang)}
								</h2>
								<p class="text-sm text-muted-foreground line-clamp-3">
									{tr(post.excerpt, data.lang)}
								</p>
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
						href={localizeHref(`/blog/tag/${data.tag.slug}?page=${n}`)}
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
