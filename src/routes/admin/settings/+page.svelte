<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Loader2, Save, Plus, Trash2, Mail, MessageCircle } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import Linkedin from '$lib/components/ui/icons/linkedin.svelte';
	import Instagram from '$lib/components/ui/icons/instagram.svelte';
	import { cn } from '$lib/utils/cn';
	import { dirty } from '$lib/stores/dirty';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const {
		form: aboutForm,
		errors: aboutErrors,
		enhance: aboutEnhance,
		submitting: aboutSubmitting,
		delayed: aboutDelayed,
		tainted: aboutTainted
	} = superForm(data.aboutForm, {
		dataType: 'json',
		resetForm: false,
		taintedMessage: null,
		onUpdated: ({ form }) => {
			if (form.valid) dirty.clear('settings:about');
		}
	});
	const {
		form: siteForm,
		errors: siteErrors,
		enhance: siteEnhance,
		submitting: siteSubmitting,
		delayed: siteDelayed,
		tainted: siteTainted
	} = superForm(data.siteForm, {
		dataType: 'json',
		resetForm: false,
		taintedMessage: null,
		onUpdated: ({ form }) => {
			if (form.valid) dirty.clear('settings:site');
		}
	});

	$effect(() => {
		const t = $aboutTainted;
		if (t && Object.keys(t).length > 0) dirty.mark('settings:about');
	});
	$effect(() => {
		const t = $siteTainted;
		if (t && Object.keys(t).length > 0) dirty.mark('settings:site');
	});

	onDestroy(() => {
		dirty.clear('settings:about');
		dirty.clear('settings:site');
	});

	const platforms = [
		{ value: 'github', label: 'GitHub', icon: Github },
		{ value: 'email', label: 'Email', icon: Mail },
		{ value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
		{ value: 'instagram', label: 'Instagram', icon: Instagram },
		{ value: 'discord', label: 'Discord', icon: MessageCircle }
	] as const;

	function addSocial() {
		aboutForm.update((v) => ({
			...v,
			socials: [...v.socials, { platform: 'github', label: '', url: '' }]
		}));
	}
	function removeSocial(idx: number) {
		aboutForm.update((v) => ({
			...v,
			socials: v.socials.filter((_, i) => i !== idx)
		}));
	}
</script>

<svelte:head><title>Settings — Admin</title></svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Site settings</h1>
	<p class="text-sm text-muted-foreground">About bio, social links, and site metadata.</p>
</div>

<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
	<!-- About -->
	<form method="POST" action="?/saveAbout" use:aboutEnhance class="space-y-5">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">About — headline</h2>
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">English</span>
					<input
						bind:value={$aboutForm.headlineEn}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$aboutErrors.headlineEn && 'border-destructive'
						)}
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Indonesian</span>
					<input
						bind:value={$aboutForm.headlineId}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$aboutErrors.headlineId && 'border-destructive'
						)}
					/>
				</label>
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-2 text-sm font-medium">Bio paragraphs</h2>
			<p class="mb-4 text-xs text-muted-foreground">
				Separate paragraphs with a blank line. Same paragraph order applies to both languages.
			</p>
			<div class="grid grid-cols-1 gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">English</span>
					<textarea
						rows="6"
						bind:value={$aboutForm.paragraphsEn}
						class="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
					></textarea>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Indonesian</span>
					<textarea
						rows="6"
						bind:value={$aboutForm.paragraphsId}
						class="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
					></textarea>
				</label>
			</div>
		</section>

		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-sm font-medium">Social links</h2>
				<button
					type="button"
					onclick={addSocial}
					class="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-xs hover:bg-accent"
				>
					<Plus class="h-3.5 w-3.5" /> Add
				</button>
			</div>
			<div class="space-y-2">
				{#each $aboutForm.socials as _, i (i)}
					<div class="flex items-center gap-2 rounded-md border border-border bg-background/50 p-2">
						<select
							bind:value={$aboutForm.socials[i].platform}
							class="h-9 rounded-md border border-input bg-background px-2 text-xs outline-none focus:border-primary"
						>
							{#each platforms as p (p.value)}
								<option value={p.value}>{p.label}</option>
							{/each}
						</select>
						<input
							bind:value={$aboutForm.socials[i].label}
							placeholder="Label"
							class="h-9 w-32 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
						/>
						<input
							bind:value={$aboutForm.socials[i].url}
							placeholder="https://… or mailto:…"
							class="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
						/>
						<button
							type="button"
							onclick={() => removeSocial(i)}
							class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						>
							<Trash2 class="h-4 w-4" />
						</button>
					</div>
				{/each}
			</div>
		</section>

		<button
			type="submit"
			disabled={$aboutSubmitting}
			class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-70"
		>
			{#if $aboutDelayed || $aboutSubmitting}
				<Loader2 class="h-4 w-4 animate-spin" /> Saving…
			{:else}
				<Save class="h-4 w-4" /> Save about
			{/if}
		</button>
	</form>

	<!-- Site -->
	<form method="POST" action="?/saveSite" use:siteEnhance class="space-y-5">
		<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h2 class="mb-4 text-sm font-medium">Site metadata</h2>
			<div class="grid grid-cols-1 gap-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Site name</span>
					<input
						bind:value={$siteForm.siteName}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$siteErrors.siteName && 'border-destructive'
						)}
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Owner</span>
					<input
						bind:value={$siteForm.owner}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$siteErrors.owner && 'border-destructive'
						)}
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">OG image</span>
					<input
						bind:value={$siteForm.ogImage}
						placeholder="/akm-2.png"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
					/>
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Base URL</span>
					<input
						bind:value={$siteForm.baseUrl}
						placeholder="https://example.com"
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$siteErrors.baseUrl && 'border-destructive'
						)}
					/>
					{#if $siteErrors.baseUrl}
						<p class="text-xs text-destructive">{$siteErrors.baseUrl[0]}</p>
					{/if}
				</label>
			</div>
		</section>

		<button
			type="submit"
			disabled={$siteSubmitting}
			class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-70"
		>
			{#if $siteDelayed || $siteSubmitting}
				<Loader2 class="h-4 w-4 animate-spin" /> Saving…
			{:else}
				<Save class="h-4 w-4" /> Save metadata
			{/if}
		</button>
	</form>
</div>
