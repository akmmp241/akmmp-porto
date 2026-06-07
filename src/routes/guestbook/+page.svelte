<script lang="ts">
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { guestbookFormSchema } from '$lib/schemas/engagement';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import { Loader2, MessageSquare, ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { page as sveltePage } from '$app/state';

	let { data } = $props();

	let optimisticEntries = $state<Array<{ author: string; message: string; createdAt: Date; pending: boolean }>>([]);
	let now = $state(Date.now());

	// Update live relative timestamps every 10 seconds
	onMount(() => {
		$form._loadedAt = Date.now().toString();
		const interval = setInterval(() => {
			now = Date.now();
		}, 10000);
		return () => clearInterval(interval);
	});

	const { form, errors, enhance, delayed, message } = superForm(data.form, {
		validators: zodClient(guestbookFormSchema),
		onSubmit({ formData }) {
			const author = formData.get('author') as string;
			const msg = formData.get('message') as string;
			// Push entry in optimistic state
			optimisticEntries = [
				{
					author,
					message: msg,
					createdAt: new Date(),
					pending: true
				},
				...optimisticEntries
			];
		},
		onUpdated({ form }) {
			if (!form.valid) {
				// Remove optimistic entries if server returns validation error
				optimisticEntries = [];
			}
		}
	});

	// Simple hash to generate gradient backgrounds from name initials
	function getGradient(name: string) {
		const initials = name.slice(0, 2).toUpperCase();
		let hash = 0;
		for (let i = 0; i < initials.length; i++) {
			hash = initials.charCodeAt(i) + ((hash << 5) - hash);
		}
		const h1 = Math.abs(hash % 360);
		const h2 = (h1 + 60) % 360;
		return `linear-gradient(135deg, hsl(${h1}, 75%, 65%), hsl(${h2}, 85%, 55%))`;
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.slice(0, 2)
			.join('')
			.toUpperCase();
	}

	function getRelativeTime(date: Date | string) {
		const elapsed = now - new Date(date).getTime();
		const seconds = Math.floor(elapsed / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (seconds < 5) return 'just now';
		if (seconds < 60) return `${seconds}s ago`;
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return `${days}d ago`;
	}
</script>

<svelte:head>
	<title>Guestbook · Akmal MP</title>
</svelte:head>

<section class="mx-auto flex max-w-4xl flex-col gap-12 px-6 lg:p-0">
	<div>
		<SectionHeading>Guestbook</SectionHeading>
		<p class="text-muted-foreground mt-2 max-w-2xl">
			Leave a public message for future visitors. Your initials will generate a unique colored avatar.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-12 md:grid-cols-[1fr_300px]">
		<!-- Entries list -->
		<div class="flex flex-col gap-6">
			<!-- Optimistic submissions -->
			{#each optimisticEntries as entry}
				<div class="flex gap-4 rounded-lg border border-border/60 bg-card/10 p-4 opacity-60 animate-pulse">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
						style:background={getGradient(entry.author)}
					>
						{getInitials(entry.author)}
					</div>
					<div class="flex flex-1 flex-col gap-1">
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold">{entry.author}</span>
							<span class="text-xs text-muted-foreground flex items-center gap-1">
								<Loader2 class="h-3 w-3 animate-spin" /> Pending review
							</span>
						</div>
						<p class="text-sm text-foreground/90 break-words">{entry.message}</p>
					</div>
				</div>
			{/each}

			{#if data.entries.length === 0 && optimisticEntries.length === 0}
				<div class="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg border-border">
					<MessageSquare class="h-8 w-8 text-muted-foreground mb-2" />
					<p class="text-sm text-muted-foreground">No entries yet. Be the first to sign the guestbook!</p>
				</div>
			{:else}
				{#each data.entries as entry (entry.id)}
					<div class="flex gap-4 rounded-lg border border-border bg-card/20 p-4 backdrop-blur-sm transition-colors hover:bg-card/40">
						<div
							class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
							style:background={getGradient(entry.author)}
						>
							{getInitials(entry.author)}
						</div>
						<div class="flex flex-1 flex-col gap-1">
							<div class="flex items-center justify-between">
								<span class="text-sm font-semibold">{entry.author}</span>
								<span class="text-xs text-muted-foreground tabular-nums">
									{getRelativeTime(entry.createdAt)}
								</span>
							</div>
							<p class="text-sm text-foreground/90 break-words">{entry.message}</p>
						</div>
					</div>
				{/each}
			{/if}

			<!-- Pagination -->
			{#if data.pagination.totalPages > 1}
				<div class="flex items-center justify-center gap-4 mt-6">
					<a
						href="?page={data.pagination.page - 1}"
						class="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors {data.pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}"
					>
						<ChevronLeft class="h-4 w-4" /> Previous
					</a>
					<span class="text-sm text-muted-foreground">
						Page {data.pagination.page} of {data.pagination.totalPages}
					</span>
					<a
						href="?page={data.pagination.page + 1}"
						class="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors {data.pagination.page === data.pagination.totalPages ? 'pointer-events-none opacity-50' : ''}"
					>
						Next <ChevronRight class="h-4 w-4" />
					</a>
				</div>
			{/if}
		</div>

		<!-- Submit Form Card -->
		<div class="h-fit rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h3 class="text-base font-semibold mb-4">Sign Guestbook</h3>
			<form method="POST" use:enhance class="flex flex-col gap-4">
				<div style="position: absolute; left: -9999px;">
					<label for="honeypot">Leave this empty if you are human</label>
					<input type="text" id="honeypot" name="honeypot" bind:value={$form.honeypot} tabindex="-1" autocomplete="off" />
				</div>
				<input type="hidden" name="_loadedAt" bind:value={$form._loadedAt} />

				<!-- Name / Author -->
				<div class="relative z-0 w-full group">
					<input
						type="text"
						name="author"
						id="author"
						bind:value={$form.author}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors"
						placeholder=" "
						required
					/>
					<label
						for="author"
						class="peer-focus:font-medium absolute text-xs text-muted-foreground duration-300 transform -translate-y-5 scale-75 top-2.5 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-primary"
					>
						Name
					</label>
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					{#if $errors.author}
						<span class="text-xs text-destructive mt-1">{$errors.author}</span>
					{/if}
				</div>

				<!-- Message -->
				<div class="relative z-0 w-full group">
					<textarea
						name="message"
						id="message"
						rows="3"
						bind:value={$form.message}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors resize-none"
						placeholder=" "
						required
					></textarea>
					<label
						for="message"
						class="peer-focus:font-medium absolute text-xs text-muted-foreground duration-300 transform -translate-y-5 scale-75 top-2.5 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-5 peer-focus:text-primary"
					>
						Message
					</label>
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					{#if $errors.message}
						<span class="text-xs text-destructive mt-1">{$errors.message}</span>
					{/if}
				</div>

				{#if $message}
					<div class="p-3 text-xs rounded bg-primary/10 text-primary border border-primary/20">
						{$message}
					</div>
				{/if}

				<button
					type="submit"
					disabled={$delayed}
					class="w-full h-9 rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-sm transition-all hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
				>
					{#if $delayed}
						<Loader2 class="h-3 w-3 animate-spin" /> Submitting...
					{:else}
						Submit
					{/if}
				</button>
			</form>
		</div>
	</div>
</section>
