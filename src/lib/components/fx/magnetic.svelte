<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	let {
		children,
		strength = 0.25,
		max = 15,
		class: cls = ''
	}: {
		children: import('svelte').Snippet;
		strength?: number;
		max?: number;
		class?: string;
	} = $props();

	let el: HTMLSpanElement;
	let tx = $state(0);
	let ty = $state(0);
	let active = $state(false);

	function clamp(v: number, lo: number, hi: number) {
		return Math.max(lo, Math.min(hi, v));
	}

	onMount(() => {
		if (!browser) return;
		const isTouch = window.matchMedia('(pointer: coarse)').matches;
		if (isTouch) return;

		const onMove = (e: PointerEvent) => {
			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;
			tx = clamp((e.clientX - cx) * strength, -max, max);
			ty = clamp((e.clientY - cy) * strength, -max, max);
		};
		const enter = () => (active = true);
		const leave = () => {
			active = false;
			tx = 0;
			ty = 0;
		};
		el.addEventListener('pointerenter', enter);
		el.addEventListener('pointermove', onMove);
		el.addEventListener('pointerleave', leave);
		return () => {
			el.removeEventListener('pointerenter', enter);
			el.removeEventListener('pointermove', onMove);
			el.removeEventListener('pointerleave', leave);
		};
	});
</script>

<span
	bind:this={el}
	class={cn('inline-block will-change-transform', cls)}
	style="transform: translate({tx}px, {ty}px); transition: transform {active
		? '120ms'
		: '300ms'} var(--ease-spring)"
>
	{@render children()}
</span>
