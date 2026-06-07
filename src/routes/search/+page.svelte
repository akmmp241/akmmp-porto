<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Search as SearchIcon, FileText, FolderKanban, Loader2 } from '@lucide/svelte';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import { cn } from '$lib/utils/cn';
	import type { LangCode } from '$lib/i18n';
	import type { PageData } from './$types';
	import type { SearchResult } from '$lib/server/search';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	let q = $state(data.q);
	let liveResults = $state<SearchResult[] | null>(null);
	let loading = $state(false);
	let activeType = $state<'all' | 'post' | 'project'>(data.type);
	let timer: ReturnType<typeof setTimeout> | null = null;
	let isMounted = true;

	const display = $derived(liveResults ?? data.results);

	const filtered = $derived(
		activeType === 'all' ? display : display.filter((r) => r.type === activeType)
	);

	const counts = $derived({
		all: display.length,
		post: display.filter((r) => r.type === 'post').length,
		project: display.filter((r) => r.type === 'project').length
	});

	onDestroy(() => {
		isMounted = false;
		if (timer) clearTimeout(timer);
	});

	function onInput(value: string) {
		q = value;
		if (timer) clearTimeout(timer);
		if (!value.trim()) {
			liveResults = [];
			loading = false;
			return;
		}
		loading = true;
		timer = setTimeout(async () => {
			try {
				const r = await fetch(
					`/api/search?q=${encodeURIComponent(value)}&type=${activeType}`
				);
				if (r.ok && isMounted) {
					const j = await r.json();
					liveResults = j.results;
				}
			} catch {
				// ignore
			} finally {
				if (isMounted) {
					loading = false;
				}
			}
		}, 200);
	}

	function changeType(t: 'all' | 'post' | 'project') {
		activeType = t;
		if (q.trim()) onInput(q);
	}
</script>

<svelte:head>
	<title>Search · Akmal MP</title>
</svelte:head>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>search</SectionHeading>

	<form method="GET" action={localizeHref('/search')} class="flex flex-col gap-4">
		<div class="relative">
			<SearchIcon class="text-muted-foreground absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" />
			<input
				type="search"
				name="q"
				placeholder={data.lang === 'id' ? 'Cari posting, proyek…' : 'Search posts, projects…'}
				bind:value={q}
				oninput={(e) => onInput(e.currentTarget.value)}
				autocomplete="off"
				autofocus
				class="border-border focus:border-primary h-14 w-full rounded-xl border bg-card pl-12 pr-12 text-base outline-none transition-colors"
			/>
			{#if loading}
				<Loader2 class="text-muted-foreground absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />
			{/if}
		</div>
		<input type="hidden" name="type" value={activeType} />
	</form>

	<div class="flex flex-wrap gap-2">
		{#each [{ k: 'all', label: 'All' }, { k: 'post', label: 'Posts' }, { k: 'project', label: 'Projects' }] as opt (opt.k)}
			<button
				type="button"
				onclick={() => changeType(opt.k as 'all' | 'post' | 'project')}
				class={cn(
					'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
					activeType === opt.k
						? 'border-primary text-primary bg-primary/5'
						: 'border-border text-muted-foreground hover:text-foreground'
				)}
			>
				{opt.label}
				<span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
					{counts[opt.k as keyof typeof counts]}
				</span>
			</button>
		{/each}
	</div>

	{#if !q.trim()}
		<div class="rounded-xl border border-border bg-card/30 p-12 text-center text-muted-foreground">
			{data.lang === 'id' ? 'Mulai mengetik untuk mencari.' : 'Start typing to search.'}
		</div>
	{:else if filtered.length === 0 && !loading}
		<div class="rounded-xl border border-border bg-card/30 p-12 text-center">
			<p class="text-muted-foreground">
				{data.lang === 'id' ? 'Tidak ada hasil untuk' : 'No results for'}
				<span class="text-foreground font-medium">"{q}"</span>.
			</p>
			<p class="mt-2 text-xs text-muted-foreground">
				{data.lang === 'id'
					? 'Coba kata kunci yang lebih umum atau cek ejaan.'
					: 'Try broader keywords or check the spelling.'}
			</p>
		</div>
	{:else}
		<div class="flex flex-col gap-4">
			{#each filtered as r, i (r.type + ':' + r.id)}
				<Reveal delay={Math.min(i, 8) * 40}>
					<a
						href={localizeHref(r.type === 'post' ? `/blog/${r.slug}` : `/projects/${r.slug}`)}
						class="group flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
					>
						<div class="flex items-center gap-2 text-xs text-muted-foreground">
							{#if r.type === 'post'}
								<FileText class="h-3.5 w-3.5" /> Post
							{:else}
								<FolderKanban class="h-3.5 w-3.5" /> Project
							{/if}
							<span class="opacity-30">·</span>
							<span class="font-mono">{r.slug}</span>
						</div>
						<h3 class="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">
							{r.title}
						</h3>
						<p class="search-snippet text-sm text-muted-foreground">
							{@html r.snippet || r.excerpt}
						</p>
					</a>
				</Reveal>
			{/each}
		</div>
	{/if}
</section>

<style>
	:global(.search-snippet mark) {
		background: color-mix(in oklab, var(--color-primary) 25%, transparent);
		color: var(--color-foreground);
		padding: 0 0.15rem;
		border-radius: 0.15rem;
	}
</style>
