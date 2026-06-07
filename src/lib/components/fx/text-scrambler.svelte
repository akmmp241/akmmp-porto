<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let {
		text,
		duration = 400,
		class: cls = ''
	}: { text: string; duration?: number; class?: string } = $props();

	// svelte-ignore state_referenced_locally
	let display = $state(text);
	const chars = '!<>-_\\/[]{}—=+*^?#________';

	onMount(() => {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			display = text;
			return;
		}

		let raf: number;
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration);
			let out = '';
			for (let i = 0; i < text.length; i++) {
				if (i < t * text.length) {
					out += text[i];
				} else {
					out += chars[Math.floor(Math.random() * chars.length)];
				}
			}
			display = out;
			if (t < 1) raf = requestAnimationFrame(tick);
			else display = text;
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<span class={cls}>{display}</span>
