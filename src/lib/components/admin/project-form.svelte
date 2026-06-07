<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { dirty } from '$lib/stores/dirty';
	import { onDestroy } from 'svelte';
	import { Loader2, Save, ArrowLeft, Trash2 } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import ImageDropzone from './image-dropzone.svelte';
	import type { ProjectFormSchema } from '$lib/schemas/admin';
	import type { Infer } from 'sveltekit-superforms';

	type Props = {
		form: SuperValidated<Infer<ProjectFormSchema>>;
		mode: 'new' | 'edit';
		projectId?: number;
	};

	let { form: initial, mode, projectId }: Props = $props();

	const action = mode === 'new' ? '' : '?/update';
	const dirtyKey = `project:${mode}:${projectId ?? 'new'}`;

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
</script>

<div class="mb-6 flex items-center gap-3">
	<a
		href="/admin/projects"
		class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
	>
		<ArrowLeft class="h-3.5 w-3.5" /> Projects
	</a>
	<h1 class="text-2xl font-semibold tracking-tight">
		{mode === 'new' ? 'New project' : 'Edit project'}
	</h1>
</div>

<form method="POST" {action} use:enhance class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<div class="space-y-5 lg:col-span-2">
		<section
			class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm"
		>
			<h2 class="mb-4 text-sm font-medium">Details</h2>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Title</span>
					<input
						name="title"
						bind:value={$form.title}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary',
							$errors.title && 'border-destructive'
						)}
					/>
					{#if $errors.title}<p class="text-xs text-destructive">{$errors.title[0]}</p>{/if}
				</label>

				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Slug</span>
					<input
						name="slug"
						bind:value={$form.slug}
						placeholder="my-project"
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-primary',
							$errors.slug && 'border-destructive'
						)}
					/>
					{#if $errors.slug}<p class="text-xs text-destructive">{$errors.slug[0]}</p>{/if}
				</label>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Description (English)</span>
					<textarea
						name="descriptionEn"
						rows="3"
						bind:value={$form.descriptionEn}
						class={cn(
							'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary',
							$errors.descriptionEn && 'border-destructive'
						)}
					></textarea>
					{#if $errors.descriptionEn}<p class="text-xs text-destructive">{$errors.descriptionEn[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Description (Indonesian)</span>
					<textarea
						name="descriptionId"
						rows="3"
						bind:value={$form.descriptionId}
						class={cn(
							'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary',
							$errors.descriptionId && 'border-destructive'
						)}
					></textarea>
					{#if $errors.descriptionId}<p class="text-xs text-destructive">{$errors.descriptionId[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground"
						>Tech stack <span class="font-normal opacity-60">(comma separated)</span></span
					>
					<input
						name="techstack"
						bind:value={$form.techstack}
						placeholder="Next.js, TypeScript, Postgres"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
					/>
				</label>
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Links</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Frontend repo</span>
					<input
						name="badgeFe"
						bind:value={$form.badgeFe}
						placeholder="https://"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
					/>
					{#if $errors.badgeFe}<p class="text-xs text-destructive">{$errors.badgeFe[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Backend repo</span>
					<input
						name="badgeBe"
						bind:value={$form.badgeBe}
						placeholder="https://"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
					/>
					{#if $errors.badgeBe}<p class="text-xs text-destructive">{$errors.badgeBe[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Live URL</span>
					<input
						name="badgeLive"
						bind:value={$form.badgeLive}
						placeholder="https://"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
					/>
					{#if $errors.badgeLive}<p class="text-xs text-destructive">{$errors.badgeLive[0]}</p>{/if}
				</label>
			</div>
		</section>
	</div>

	<aside class="space-y-5">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Image</h2>
			<ImageDropzone bind:value={$form.image} name="image" />
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Visibility</h2>
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					name="featured"
					bind:checked={$form.featured}
					class="h-4 w-4 rounded border-border accent-primary"
				/>
				<span class="text-sm">Featured on homepage</span>
			</label>
		</section>

		<div class="flex items-center gap-2">
			<button
				type="submit"
				disabled={$submitting}
				class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
			>
				{#if $delayed || $submitting}
					<Loader2 class="h-4 w-4 animate-spin" /> Saving…
				{:else}
					<Save class="h-4 w-4" /> {mode === 'new' ? 'Create' : 'Save changes'}
				{/if}
			</button>
		</div>

		{#if mode === 'edit'}
			<form
				method="POST"
				action="?/delete"
				onsubmit={(e) => {
					if (!confirm('Delete this project? This cannot be undone.')) e.preventDefault();
				}}
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
			>
				<h3 class="text-xs font-medium text-destructive">Danger zone</h3>
				<p class="mt-1 text-xs text-muted-foreground">Permanently delete this project.</p>
				<button
					type="submit"
					class="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-white"
				>
					<Trash2 class="h-3.5 w-3.5" /> Delete project
				</button>
			</form>
		{/if}
	</aside>
</form>
