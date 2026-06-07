<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { dirty } from '$lib/stores/dirty';
	import { onDestroy } from 'svelte';
	import { Loader2, Save } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import type { CaseStudyFormSchema } from '$lib/schemas/admin';
	import type { Infer } from 'sveltekit-superforms';

	type Props = {
		form: SuperValidated<Infer<CaseStudyFormSchema>>;
		projectId: number;
	};

	let { form: initial, projectId }: Props = $props();

	const dirtyKey = `case-study:${projectId}`;

	const sf = superForm(initial, {
		dataType: 'json',
		resetForm: false,
		taintedMessage: null,
		onUpdated: ({ form }) => {
			if (form.valid) dirty.clear(dirtyKey);
		}
	});
	const { form, errors, enhance, submitting, delayed, tainted } = sf;

	$effect(() => {
		if ($tainted && Object.keys($tainted).length > 0) dirty.mark(dirtyKey);
		else dirty.clear(dirtyKey);
	});

	onDestroy(() => dirty.clear(dirtyKey));

	let activeLocale = $state<'en' | 'id'>('en');
</script>

<form method="POST" action="?/saveCaseStudy" use:enhance class="space-y-5">
	<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-sm font-medium">Long-form case study</h2>
			<div class="flex items-center gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
				<button
					type="button"
					onclick={() => (activeLocale = 'en')}
					class={cn(
						'rounded px-2.5 py-1 transition-colors',
						activeLocale === 'en' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
					)}
				>EN</button>
				<button
					type="button"
					onclick={() => (activeLocale = 'id')}
					class={cn(
						'rounded px-2.5 py-1 transition-colors',
						activeLocale === 'id' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
					)}
				>ID</button>
			</div>
		</div>

		<div class={cn(activeLocale === 'en' ? 'block' : 'hidden')}>
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted-foreground">Body (EN, Markdown)</span>
				<textarea
					name="contentEn"
					rows="20"
					bind:value={$form.contentEn}
					spellcheck="false"
					class="min-h-72 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-primary"
				></textarea>
				{#if $errors.contentEn}<p class="text-xs text-destructive">{$errors.contentEn[0]}</p>{/if}
			</label>
		</div>
		<div class={cn(activeLocale === 'id' ? 'block' : 'hidden')}>
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted-foreground">Body (ID, Markdown)</span>
				<textarea
					name="contentId"
					rows="20"
					bind:value={$form.contentId}
					spellcheck="false"
					class="min-h-72 rounded-md border border-input bg-background px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:border-primary"
				></textarea>
				{#if $errors.contentId}<p class="text-xs text-destructive">{$errors.contentId[0]}</p>{/if}
			</label>
		</div>
	</section>

	<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<h2 class="mb-2 text-sm font-medium">Gallery</h2>
		<p class="mb-3 text-xs text-muted-foreground">
			One image path per line. Upload via the project image dropzone, then paste paths.
		</p>
		<textarea
			name="gallery"
			rows="6"
			bind:value={$form.gallery}
			placeholder={'/uploads/projects/abc.webp\n/uploads/projects/def.webp'}
			class="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:border-primary"
		></textarea>
	</section>

	<button
		type="submit"
		disabled={$submitting}
		class="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
	>
		{#if $delayed || $submitting}
			<Loader2 class="h-4 w-4 animate-spin" /> Saving…
		{:else}
			<Save class="h-4 w-4" /> Save case study
		{/if}
	</button>
</form>
