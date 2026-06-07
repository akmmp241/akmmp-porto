<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	type Direction = 'up' | 'down' | 'left' | 'right';

	let {
		children,
		direction = 'up',
		delay = 0,
		duration = 450,
		threshold = 0.15,
		once = true,
		class: cls = ''
	}: {
		children: import('svelte').Snippet;
		direction?: Direction;
		delay?: number;
		duration?: number;
		threshold?: number;
		once?: boolean;
		class?: string;
	} = $props();

	let el: HTMLDivElement;
	let revealed = $state(false);
	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	onMount(() => {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			revealed = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						timeoutId = setTimeout(() => (revealed = true), delay);
						if (once) observer.unobserve(entry.target);
					} else if (!once) {
						revealed = false;
					}
				}
			},
			{ threshold }
		);
		observer.observe(el);
		return () => {
			observer.disconnect();
			if (timeoutId) clearTimeout(timeoutId);
		};
	});

	const directionClass: Record<Direction, string> = {
		up: 'reveal',
		down: 'reveal',
		left: 'reveal reveal-left',
		right: 'reveal reveal-right'
	};
</script>

<div
	bind:this={el}
	class={cn(directionClass[direction], revealed && 'revealed', cls)}
	style="transition-duration: {duration}ms"
>
	{@render children()}
</div>
