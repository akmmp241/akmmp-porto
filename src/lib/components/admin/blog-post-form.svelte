<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { dirty } from '$lib/stores/dirty';
	import { onDestroy } from 'svelte';
	import { Loader2, Save, ArrowLeft, Trash2 } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import ImageDropzone from './image-dropzone.svelte';
	import BlockEditor from './block-editor.svelte';
	import type { BlogPostFormSchema } from '$lib/schemas/admin';
	import type { Infer } from 'sveltekit-superforms';

	type Props = {
		form: SuperValidated<Infer<BlogPostFormSchema>>;
		mode: 'new' | 'edit';
		postId?: number;
	};

	let { form: initial, mode, postId }: Props = $props();

	const action = mode === 'new' ? '' : '?/update';
	const dirtyKey = `blog:${mode}:${postId ?? 'new'}`;

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

	function autoSlug() {
		if ($form.slug) return;
		$form.slug = $form.titleEn
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.slice(0, 80);
	}
</script>

<div class="mb-6 flex items-center gap-3">
	<a
		href="/admin/blog"
		class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
	>
		<ArrowLeft class="h-3.5 w-3.5" /> Posts
	</a>
	<h1 class="text-2xl font-semibold tracking-tight">
		{mode === 'new' ? 'New post' : 'Edit post'}
	</h1>
</div>

<form method="POST" {action} use:enhance class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<input type="hidden" name="contentFormat" bind:value={$form.contentFormat} />
	<div class="space-y-5 lg:col-span-2">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-medium">Content</h2>
				<div class="flex items-center gap-1 rounded-md border border-border bg-background p-0.5 text-xs">
					<button
						type="button"
						onclick={() => (activeLocale = 'en')}
						class={cn(
							'rounded px-2.5 py-1 transition-colors',
							activeLocale === 'en'
								? 'bg-primary/15 text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>EN</button>
					<button
						type="button"
						onclick={() => (activeLocale = 'id')}
						class={cn(
							'rounded px-2.5 py-1 transition-colors',
							activeLocale === 'id'
								? 'bg-primary/15 text-primary'
								: 'text-muted-foreground hover:text-foreground'
						)}
					>ID</button>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Title (EN)</span>
					<input
						name="titleEn"
						bind:value={$form.titleEn}
						onblur={autoSlug}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary',
							$errors.titleEn && 'border-destructive'
						)}
					/>
					{#if $errors.titleEn}<p class="text-xs text-destructive">{$errors.titleEn[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Title (ID)</span>
					<input
						name="titleId"
						bind:value={$form.titleId}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-primary',
							$errors.titleId && 'border-destructive'
						)}
					/>
					{#if $errors.titleId}<p class="text-xs text-destructive">{$errors.titleId[0]}</p>{/if}
				</label>
			</div>

			<div class="mt-4 grid grid-cols-1 gap-4">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Slug</span>
					<input
						name="slug"
						bind:value={$form.slug}
						placeholder="my-post-slug"
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 font-mono text-sm outline-none transition-colors focus:border-primary',
							$errors.slug && 'border-destructive'
						)}
					/>
					{#if $errors.slug}<p class="text-xs text-destructive">{$errors.slug[0]}</p>{/if}
				</label>

				<div class={cn(activeLocale === 'en' ? 'block' : 'hidden')}>
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Excerpt (EN)</span>
						<textarea
							name="excerptEn"
							rows="2"
							bind:value={$form.excerptEn}
							class={cn(
								'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary',
								$errors.excerptEn && 'border-destructive'
							)}
						></textarea>
						{#if $errors.excerptEn}<p class="text-xs text-destructive">{$errors.excerptEn[0]}</p>{/if}
					</label>
				</div>
				<div class={cn(activeLocale === 'id' ? 'block' : 'hidden')}>
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Excerpt (ID)</span>
						<textarea
							name="excerptId"
							rows="2"
							bind:value={$form.excerptId}
							class={cn(
								'rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary',
								$errors.excerptId && 'border-destructive'
							)}
						></textarea>
						{#if $errors.excerptId}<p class="text-xs text-destructive">{$errors.excerptId[0]}</p>{/if}
					</label>
				</div>

				<div>
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-medium text-muted-foreground">Body</span>
						<BlockEditor bind:value={$form.content} uploadEndpoint="/admin/api/upload/blog-image" />
						{#if $errors.content}<p class="text-xs text-destructive">{$errors.content[0]}</p>{/if}
					</label>
				</div>
			</div>
		</section>
	</div>

	<aside class="space-y-5">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Cover image</h2>
			<ImageDropzone bind:value={$form.coverImage} name="coverImage" />
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Tags</h2>
			<label class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted-foreground">Comma separated</span>
				<input
					name="tags"
					bind:value={$form.tags}
					placeholder="systems, postgres, rust"
					class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
				/>
			</label>
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Publish</h2>
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					name="published"
					bind:checked={$form.published}
					class="h-4 w-4 rounded border-border accent-primary"
				/>
				<span class="text-sm">Publish post</span>
			</label>
			<label class="mt-3 flex flex-col gap-1.5">
				<span class="text-xs font-medium text-muted-foreground">
					Publish date <span class="font-normal opacity-60">(optional)</span>
				</span>
				<input
					name="publishedAt"
					type="datetime-local"
					bind:value={$form.publishedAt}
					class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
				/>
			</label>
		</section>

		<div class="flex items-center gap-2">
			<button
				type="submit"
				disabled={$submitting}
				class="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
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
					if (!confirm('Delete this post? This cannot be undone.')) e.preventDefault();
				}}
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4"
			>
				<h3 class="text-xs font-medium text-destructive">Danger zone</h3>
				<p class="mt-1 text-xs text-muted-foreground">Permanently delete this post.</p>
				<button
					type="submit"
					class="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-medium text-white"
				>
					<Trash2 class="h-3.5 w-3.5" /> Delete post
				</button>
			</form>
		{/if}
	</aside>
</form>
