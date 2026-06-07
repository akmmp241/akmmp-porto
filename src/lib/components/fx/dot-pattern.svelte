<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	let {
		width = 16,
		height = 16,
		cr = 1,
		glow = false,
		parallax = 0,
		class: cls = ''
	}: {
		width?: number;
		height?: number;
		cr?: number;
		glow?: boolean;
		parallax?: number;
		class?: string;
	} = $props();

	// cx/cy props removed – CSS bg-position handles dot placement natively
	let ty = $state(0);

	onMount(() => {
		if (!browser || parallax === 0) return;
		let raf: number;
		const onScroll = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				ty = window.scrollY * parallax;
			});
		};
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(raf);
		};
	});
</script>

<!--
  Single <div> replacing hundreds of SVG <circle> elements.
  The dot grid is a pure CSS radial-gradient background-image pattern.
  `glow` adds a subtle CSS animation on the :before pseudo-element.
-->
<div
	aria-hidden="true"
	class={cn('dot-pattern pointer-events-none absolute inset-0 h-full w-full', glow && 'dot-glow', cls)}
	style="--dot-size:{cr * 2}px; --dot-gap-x:{width}px; --dot-gap-y:{height}px; transform: translateY({ty}px);"
></div>

<style>
	.dot-pattern {
		background-image: radial-gradient(
			circle,
			oklch(0.6 0 0 / 0.35) var(--dot-size),
			transparent var(--dot-size)
		);
		background-size: var(--dot-gap-x) var(--dot-gap-y);
		background-position: center center;
	}

	:global(.dark) .dot-pattern {
		background-image: radial-gradient(
			circle,
			oklch(0.75 0 0 / 0.25) var(--dot-size),
			transparent var(--dot-size)
		);
	}

	/* Glow: breathing radial overlay on top of the static dot grid */
	.dot-glow::before {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(
			ellipse 60% 50% at 50% 50%,
			oklch(0.65 0.12 295 / 0.12) 0%,
			transparent 70%
		);
		animation: dot-glow-breathe 4s ease-in-out infinite alternate;
	}

	@keyframes dot-glow-breathe {
		from { opacity: 0.5; }
		to   { opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.dot-glow::before {
			animation: none;
		}
	}
</style>
