<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { m } from '$lib/paraglide/messages.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import ProjectCard from '$lib/components/sections/project-card.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import { cn } from '$lib/utils/cn';
	import type { LangCode } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	const allTechs = $derived.by(() => {
		const set = new SvelteSet<string>();
		for (const p of data.projects) for (const t of p.techstack) set.add(t);
		return Array.from(set).sort();
	});

	let selected = $state<string | null>(null);

	const filtered = $derived.by(() => {
		if (!selected) return data.projects;
		return data.projects.filter((p) => p.techstack.includes(selected!));
	});
</script>

<svelte:head>
	<title>Projects · Akmal MP</title>
</svelte:head>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.projects_title()}</SectionHeading>
	<p class="text-muted-foreground max-w-2xl">{m.projects_page_subtitle()}</p>

	<div class="flex flex-wrap gap-2 bg-muted/20 border border-border/20 p-3 rounded-2xl">
		<button
			type="button"
			class={cn(
				'cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
				selected === null
					? 'bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/5'
					: 'bg-secondary/35 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60'
			)}
			onclick={() => (selected = null)}
		>
			{m.projects_filter_all()}
		</button>
		{#each allTechs as tech (tech)}
			<button
				type="button"
				class={cn(
					'cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200',
					selected === tech
						? 'bg-primary/10 border-primary/30 text-primary shadow-sm shadow-primary/5'
						: 'bg-secondary/35 border-border/30 text-muted-foreground hover:text-foreground hover:border-border/60'
				)}
				onclick={() => (selected = tech)}
			>
				{tech}
			</button>
		{/each}
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		{#each filtered as project, i (project.slug)}
			<Reveal delay={i * 60}>
				<ProjectCard {project} lang={data.lang} />
			</Reveal>
		{/each}
	</div>
</section>
