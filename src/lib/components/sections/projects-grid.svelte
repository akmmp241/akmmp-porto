<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import ProjectCard from './project-card.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import type { Project } from '$lib/data/schemas';
	import type { LangCode } from '$lib/i18n';

	let {
		projects,
		lang,
		showViewAll = true
	}: { projects: Project[]; lang: LangCode; showViewAll?: boolean } = $props();
</script>

<section id="projects" class="flex flex-col gap-12 px-6 lg:p-0">
	<div class="flex items-center justify-between gap-4">
		<SectionHeading>{m.projects_title()}</SectionHeading>
		{#if showViewAll}
			<a
				href={localizeHref('/projects')}
				class="text-muted-foreground hover:text-foreground text-sm transition-colors"
			>
				{m.projects_view_all()} ~~&gt;
			</a>
		{/if}
	</div>
	<div class="grid gap-4 md:grid-cols-3">
		{#each projects as project, i (project.slug)}
			<Reveal delay={i * 60}>
				<ProjectCard {project} {lang} />
			</Reveal>
		{/each}
	</div>
</section>
