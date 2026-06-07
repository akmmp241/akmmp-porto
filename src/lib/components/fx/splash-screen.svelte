<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	/**
	 * Splash overlay is rendered inline in app.html so it paints before
	 * hydration. This component fades it out once the page is ready.
	 */

	const MIN_MS = 600;
	const MAX_MS = 2500;
	const FADE_MS = 600;

	onMount(() => {
		if (!browser) return;
		const el = document.getElementById('splash-screen');
		if (!el) return;

		sessionStorage.setItem('splash-seen', '1');

		const start = performance.now();
		let hidden = false;

		const hide = () => {
			if (hidden) return;
			hidden = true;
			const elapsed = performance.now() - start;
			const wait = Math.max(0, MIN_MS - elapsed);
			setTimeout(() => {
				el.classList.add('splash-exit');
				document.documentElement.classList.remove('splash-active');
				setTimeout(() => el.remove(), FADE_MS);
			}, wait);
		};

		// Fire after two RAFs — first frame after hydration paints, second confirms.
		requestAnimationFrame(() => requestAnimationFrame(hide));
		const safety = setTimeout(hide, MAX_MS);

		return () => clearTimeout(safety);
	});
</script>
