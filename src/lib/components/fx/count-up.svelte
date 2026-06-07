<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let {
		from = 0,
		to,
		duration = 1500,
		decimals = 0,
		suffix = ''
	}: {
		from?: number;
		to: number;
		duration?: number;
		decimals?: number;
		suffix?: string;
	} = $props();

	let el: HTMLSpanElement;
	// svelte-ignore state_referenced_locally
	let value = $state(from);

	function easeOutExpo(t: number): number {
		return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
	}

	onMount(() => {
		if (!browser) {
			value = to;
			return;
		}
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			value = to;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					const start = performance.now();
					const tick = (now: number) => {
						const t = Math.min(1, (now - start) / duration);
						value = from + (to - from) * easeOutExpo(t);
						if (t < 1) requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
					observer.disconnect();
				}
			},
			{ threshold: 0.5 }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<span bind:this={el}>{value.toFixed(decimals)}{suffix}</span>
