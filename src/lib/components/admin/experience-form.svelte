<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { dirty } from '$lib/stores/dirty';
	import { onDestroy } from 'svelte';
	import { Loader2, Save, ArrowLeft, Trash2 } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import type { ExperienceFormSchema } from '$lib/schemas/admin';
	import type { Infer } from 'sveltekit-superforms';

	type Props = {
		form: SuperValidated<Infer<ExperienceFormSchema>>;
		mode: 'new' | 'edit';
		experienceId?: number;
	};

	let { form: initial, mode, experienceId }: Props = $props();

	const action = mode === 'new' ? '' : '?/update';
	const dirtyKey = `experience:${mode}:${experienceId ?? 'new'}`;

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

	const types: Array<{ value: 'work' | 'education' | 'intern' | 'project'; label: string }> = [
		{ value: 'work', label: 'Work' },
		{ value: 'intern', label: 'Internship' },
		{ value: 'education', label: 'Education' },
		{ value: 'project', label: 'Project' }
	];
</script>

<div class="mb-6 flex items-center gap-3">
	<a
		href="/admin/experiences"
		class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
	>
		<ArrowLeft class="h-3.5 w-3.5" /> Experiences
	</a>
	<h1 class="text-2xl font-semibold tracking-tight">
		{mode === 'new' ? 'New experience' : 'Edit experience'}
	</h1>
</div>

<form method="POST" {action} use:enhance class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<div class="space-y-5 lg:col-span-2">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Role</h2>
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
					<span class="text-xs font-medium text-muted-foreground">Company</span>
					<input
						name="company"
						bind:value={$form.company}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary',
							$errors.company && 'border-destructive'
						)}
					/>
					{#if $errors.company}<p class="text-xs text-destructive">{$errors.company[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Location</span>
					<input
						name="location"
						bind:value={$form.location}
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Type</span>
					<select
						name="type"
						bind:value={$form.type}
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
					>
						{#each types as t (t.value)}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
				</label>
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Description</h2>
			<div class="grid grid-cols-1 gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">English</span>
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
					<span class="text-xs font-medium text-muted-foreground">Indonesian</span>
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
						>Skills <span class="font-normal opacity-60">(comma separated)</span></span
					>
					<input
						name="skills"
						bind:value={$form.skills}
						placeholder="React, Postgres, Docker"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary"
					/>
				</label>
			</div>
		</section>
	</div>

	<aside class="space-y-5">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Period</h2>
			<div class="space-y-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Start</span>
					<input
						name="startDate"
						bind:value={$form.startDate}
						placeholder="Oct 2024"
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary',
							$errors.startDate && 'border-destructive'
						)}
					/>
					{#if $errors.startDate}<p class="text-xs text-destructive">{$errors.startDate[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">End</span>
					<input
						name="endDate"
						bind:value={$form.endDate}
						placeholder="Dec 2024"
						disabled={$form.current}
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
					/>
				</label>
				<label class="flex cursor-pointer items-center gap-3">
					<input
						type="checkbox"
						name="current"
						bind:checked={$form.current}
						class="h-4 w-4 rounded border-border accent-primary"
					/>
					<span class="text-sm">Currently active</span>
				</label>
			</div>
		</section>

		<button
			type="submit"
			disabled={$submitting}
			class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-70"
		>
			{#if $delayed || $submitting}
				<Loader2 class="h-4 w-4 animate-spin" /> Saving…
			{:else}
				<Save class="h-4 w-4" /> {mode === 'new' ? 'Create' : 'Save changes'}
			{/if}
		</button>

		{#if mode === 'edit'}
			<form
				method="POST"
				action="?/delete"
				onsubmit={(e) => {
					if (!confirm('Delete this experience?')) e.preventDefault();
				}}
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
			>
				<h3 class="text-xs font-medium text-destructive">Danger zone</h3>
				<button
					type="submit"
					class="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-white"
				>
					<Trash2 class="h-3.5 w-3.5" /> Delete
				</button>
			</form>
		{/if}
	</aside>
</form>
