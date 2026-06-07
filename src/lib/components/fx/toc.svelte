<script lang="ts">
	/**
	 * Sticky Table of Contents with scrollspy.
	 * Highlights current heading via IntersectionObserver, smooth-scrolls on click.
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	type Entry = { depth: 2 | 3; id: string; text: string };
	let { entries }: { entries: Entry[] } = $props();

	let active = $state<string>(entries[0]?.id ?? '');

	onMount(() => {
		if (!browser || entries.length === 0) return;

		const headings = entries
			.map((e) => document.getElementById(e.id))
			.filter((el): el is HTMLElement => !!el);

		if (headings.length === 0) return;

		const observer = new IntersectionObserver(
			(items) => {
				// Pick the topmost intersecting heading
				const visible = items
					.filter((i) => i.isIntersecting)
					.map((i) => i.target as HTMLElement);
				if (visible.length === 0) return;
				visible.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
				active = visible[0].id;
			},
			{ rootMargin: '-100px 0px -65% 0px', threshold: 0 }
		);
		for (const h of headings) observer.observe(h);
		return () => observer.disconnect();
	});

	function jumpTo(e: MouseEvent, id: string) {
		const el = document.getElementById(id);
		if (!el) return;
		e.preventDefault();
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
		history.replaceState(null, '', `#${id}`);
		active = id;
	}
</script>

{#if entries.length >= 3}
	<aside class="hidden xl:block">
		<nav class="sticky top-24" aria-label="Table of contents">
			<p class="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
				On this page
			</p>
			<ul class="flex flex-col gap-1.5 border-l border-border">
				{#each entries as entry (entry.id)}
					<li>
						<a
							href={`#${entry.id}`}
							onclick={(e) => jumpTo(e, entry.id)}
							class={cn(
								'-ml-px block border-l-2 py-1 text-sm transition-colors',
								entry.depth === 3 ? 'pl-6' : 'pl-3',
								active === entry.id
									? 'border-primary text-primary'
									: 'border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground'
							)}
						>
							{entry.text}
						</a>
					</li>
				{/each}
			</ul>
		</nav>
	</aside>
{/if}
