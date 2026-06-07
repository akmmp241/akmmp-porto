<script lang="ts">
	/**
	 * Thin progress bar pinned to top of viewport, scaling with scroll percentage.
	 * Uses transform-origin: left + scaleX for cheap GPU-accelerated rendering.
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let progress = $state(0);

	onMount(() => {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		function update() {
			const doc = document.documentElement;
			const max = doc.scrollHeight - doc.clientHeight;
			progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
		}

		update();
		const opts = { passive: true } as const;
		window.addEventListener('scroll', update, opts);
		window.addEventListener('resize', update, opts);
		return () => {
			window.removeEventListener('scroll', update);
			window.removeEventListener('resize', update);
		};
		// reduced-motion: bar still works (progress is direct, no animation), value just snaps.
		void reduced;
	});
</script>

<div
	aria-hidden="true"
	class="bg-primary fixed top-0 left-0 z-50 h-1 w-full origin-left"
	style="transform: scaleX({progress}); transition: transform 80ms linear;"
></div>
