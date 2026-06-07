<script lang="ts">
	import type { Project } from '$lib/data/schemas';
	import { tr, type LangCode } from '$lib/i18n';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import ProjectBadge from './project-badge.svelte';
	import TiltCard from '$lib/components/fx/tilt-card.svelte';

	let { project, lang }: { project: Project; lang: LangCode } = $props();
</script>

<TiltCard class="block h-full">
	<article class="rounded-2xl border border-border/60 sm:border-border/40 bg-card/15 hover:border-primary/40 flex flex-col transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5 group overflow-hidden h-full">
		<a
			href={localizeHref(`/projects/${project.slug}`)}
			class="block overflow-hidden relative aspect-[16/10]"
		>
			{#if project.image}
				<img
					src={project.image}
					alt={project.title}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					loading="lazy"
				/>
			{:else}
				<div class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground text-sm font-medium">
					No photo
				</div>
			{/if}
			<!-- Subtle gradient overlay on hover -->
			<div class="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
		</a>

		<!-- Tech stack inline tag badges -->
		<div class="flex flex-wrap gap-1 px-4 pt-4">
			{#each project.techstack as tech}
				<span class="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-secondary/50 text-foreground/75 border border-border/20">
					{tech}
				</span>
			{/each}
		</div>

		<div class="flex flex-1 flex-col gap-2.5 p-4 pt-3">
			<a
				href={localizeHref(`/projects/${project.slug}`)}
				class="text-lg font-bold tracking-tight transition-colors duration-200 hover:text-primary group-hover:text-primary"
			>
				{project.title}
			</a>
			<p class="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">{tr(project.description, lang)}</p>
			
			{#if project.badges.fe || project.badges.be || project.badges.live}
				<div class="flex flex-wrap gap-2.5 pt-3 mt-auto border-t border-border/20">
					{#if project.badges.be}
						<ProjectBadge href={project.badges.be} variant="be" />
					{/if}
					{#if project.badges.fe}
						<ProjectBadge href={project.badges.fe} variant="fe" />
					{/if}
					{#if project.badges.live}
						<ProjectBadge href={project.badges.live} variant="live" />
					{/if}
				</div>
			{/if}
		</div>
	</article>
</TiltCard>
