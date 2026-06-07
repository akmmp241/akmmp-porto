<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	let {
		children,
		max = 6,
		class: cls = ''
	}: {
		children: import('svelte').Snippet;
		max?: number;
		class?: string;
	} = $props();

	let el: HTMLDivElement;
	let rx = $state(0);
	let ry = $state(0);
	let scale = $state(1);

	onMount(() => {
		if (!browser) return;
		const isTouch = window.matchMedia('(pointer: coarse)').matches;
		if (isTouch) return;

		const move = (e: PointerEvent) => {
			const r = el.getBoundingClientRect();
			const x = e.clientX - r.left;
			const y = e.clientY - r.top;
			rx = -((y - r.height / 2) / r.height) * max * 2;
			ry = ((x - r.width / 2) / r.width) * max * 2;
			scale = 1.02;
		};
		const leave = () => {
			rx = 0;
			ry = 0;
			scale = 1;
		};
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerleave', leave);
		return () => {
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerleave', leave);
		};
	});
</script>

<div
	bind:this={el}
	class={cn('will-change-transform', cls)}
	style="transform: perspective(900px) rotateX({rx}deg) rotateY({ry}deg) scale({scale}); transition: transform 200ms var(--ease-out-cubic);"
>
	{@render children()}
</div>
