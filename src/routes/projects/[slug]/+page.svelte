<script lang="ts">
	import { ArrowLeft, ExternalLink, Globe } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { tr, type LangCode } from '$lib/i18n';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import ReadingProgress from '$lib/components/fx/reading-progress.svelte';
	import Toc from '$lib/components/fx/toc.svelte';
	import ProseEnhancer from '$lib/components/fx/prose-enhancer.svelte';
	import ProjectCard from '$lib/components/sections/project-card.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	let proseEl: HTMLElement | undefined = $state();

	const description = $derived(tr(data.project.description, data.lang));
</script>

<svelte:head>
	<title>{data.project.title} · Projects · Akmal MP</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.project.title} />
	<meta property="og:description" content={description} />
	{#if data.project.image}
		<meta property="og:image" content={data.project.image} />
	{/if}
</svelte:head>

{#if data.html}
	<ReadingProgress />
{/if}

<article class="flex flex-col gap-12 px-6 lg:p-0">
	<nav class="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
		<a href={localizeHref('/projects')} class="inline-flex items-center gap-1 hover:text-foreground">
			<ArrowLeft class="h-3.5 w-3.5" /> Projects
		</a>
		<span class="opacity-40">/</span>
		<span class="text-foreground">{data.project.title}</span>
	</nav>

	<header class="grid gap-8 md:grid-cols-[1fr_minmax(0,2fr)]">
		{#if data.project.image}
			<Reveal>
				<img
					src={data.project.image}
					alt={data.project.title}
					class="aspect-square w-full rounded-xl border border-border object-cover"
				/>
			</Reveal>
		{/if}
		<div class="flex flex-col justify-center gap-5">
			<Reveal>
				<h1 class="text-3xl font-bold tracking-tight md:text-4xl">{data.project.title}</h1>
			</Reveal>
			<Reveal delay={80}>
				<p class="text-lg text-muted-foreground">{description}</p>
			</Reveal>
			<Reveal delay={140}>
				<div class="flex flex-wrap gap-1.5">
					{#each data.project.techstack as tech (tech)}
						<span class="rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
							{tech}
						</span>
					{/each}
				</div>
			</Reveal>
			<Reveal delay={200}>
				<div class="flex flex-wrap gap-3 pt-2">
					{#if data.project.badges.live}
						<a
							href={data.project.badges.live}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5"
						>
							<Globe class="h-4 w-4" /> Live demo
						</a>
					{/if}
					{#if data.project.badges.fe}
						<a
							href={data.project.badges.fe}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
						>
							<Github class="h-4 w-4" /> Frontend
						</a>
					{/if}
					{#if data.project.badges.be}
						<a
							href={data.project.badges.be}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent"
						>
							<Github class="h-4 w-4" /> Backend
						</a>
					{/if}
				</div>
			</Reveal>
		</div>
	</header>

	{#if data.html}
		<div class="grid gap-12 xl:grid-cols-[1fr_220px]">
			<div bind:this={proseEl} class="prose-portfolio">
				{@html data.html}
			</div>
			<Toc entries={data.toc} />
		</div>
		<ProseEnhancer target={proseEl} />
	{/if}

	{#if data.project.gallery.length > 0}
		<section class="flex flex-col gap-4">
			<h2 class="text-xl font-semibold tracking-tight">Gallery</h2>
			<div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
				{#each data.project.gallery as src, i (src)}
					<Reveal delay={i * 60}>
						<a href={src} target="_blank" rel="noopener noreferrer" class="block">
							<img
								src={src}
								alt={`Gallery image ${i + 1}`}
								loading="lazy"
								class="aspect-[4/3] w-full rounded-lg border border-border object-cover transition-transform hover:scale-[1.02]"
							/>
						</a>
					</Reveal>
				{/each}
			</div>
		</section>
	{/if}

	{#if data.related.length > 0}
		<section class="flex flex-col gap-4 border-t border-border pt-12">
			<div class="flex items-center justify-between">
				<h2 class="text-xl font-semibold tracking-tight">Related projects</h2>
				<a
					href={localizeHref('/projects')}
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					All projects <ExternalLink class="h-3.5 w-3.5" />
				</a>
			</div>
			<div class="grid gap-4 md:grid-cols-3">
				{#each data.related as project, i (project.slug)}
					<Reveal delay={i * 60}>
						<ProjectCard {project} lang={data.lang} />
					</Reveal>
				{/each}
			</div>
		</section>
	{/if}
</article>
