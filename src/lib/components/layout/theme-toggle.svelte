<script lang="ts">
	import { Sun, Moon, Monitor } from '@lucide/svelte';
	import { userPrefersMode, setMode } from 'mode-watcher';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	let { class: cls = '' }: { class?: string } = $props();

	type DocWithVT = Document & {
		startViewTransition?: (cb: () => void) => { ready: Promise<void> };
	};

	function cycle(e: MouseEvent) {
		const cur = userPrefersMode.current;
		const next = cur === 'light' ? 'dark' : cur === 'dark' ? 'system' : 'light';

		if (browser && (document as DocWithVT).startViewTransition) {
			document.documentElement.style.setProperty('--origin-x', `${e.clientX}px`);
			document.documentElement.style.setProperty('--origin-y', `${e.clientY}px`);
			(document as DocWithVT).startViewTransition!(() => setMode(next));
			return;
		}
		setMode(next);
	}
</script>

<button
	type="button"
	onclick={cycle}
	aria-label="Toggle theme"
	class={cn(
		'text-foreground hover:bg-accent focus-visible:ring-primary focus-visible:ring-offset-background inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
		cls
	)}
>
	{#if userPrefersMode.current === 'light'}
		<Sun size={18} />
	{:else if userPrefersMode.current === 'dark'}
		<Moon size={18} />
	{:else}
		<Monitor size={18} />
	{/if}
</button>

<style>
	@keyframes theme-reveal {
		from {
			clip-path: circle(0% at var(--origin-x, 50%) var(--origin-y, 50%));
		}
		to {
			clip-path: circle(150% at var(--origin-x, 50%) var(--origin-y, 50%));
		}
	}
	:global(::view-transition-new(root)) {
		animation: theme-reveal var(--dur-page, 600ms) var(--ease-out-expo) both;
	}
	:global(::view-transition-old(root)) {
		animation: none;
	}
	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-new(root)),
		:global(::view-transition-old(root)) {
			animation: none;
		}
	}
</style>
