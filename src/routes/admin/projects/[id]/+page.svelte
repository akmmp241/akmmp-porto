<script lang="ts">
	import type { PageData } from './$types';
	import ProjectForm from '$lib/components/admin/project-form.svelte';
	import CaseStudyForm from '$lib/components/admin/case-study-form.svelte';
	import { Settings2, BookOpen } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';

	let { data }: { data: PageData } = $props();

	let tab = $state<'details' | 'case-study'>('details');
</script>

<svelte:head><title>Edit {data.project.title} — Admin</title></svelte:head>

<div class="mb-6 inline-flex rounded-md border border-border bg-card/40 p-0.5 backdrop-blur-sm">
	<button
		type="button"
		onclick={() => (tab = 'details')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
			tab === 'details' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
		)}
	>
		<Settings2 class="h-3.5 w-3.5" /> Details
	</button>
	<button
		type="button"
		onclick={() => (tab = 'case-study')}
		class={cn(
			'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors',
			tab === 'case-study' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
		)}
	>
		<BookOpen class="h-3.5 w-3.5" /> Case study
	</button>
</div>

{#if tab === 'details'}
	<ProjectForm form={data.form} mode="edit" projectId={data.project.id} />
{:else}
	<CaseStudyForm form={data.caseStudyForm} projectId={data.project.id} />
{/if}
