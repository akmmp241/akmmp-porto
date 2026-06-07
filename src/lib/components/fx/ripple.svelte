<script lang="ts">
	import { browser } from '$app/environment';
	import { cn } from '$lib/utils/cn';

	let { children, class: cls = '' }: { children: import('svelte').Snippet; class?: string } =
		$props();

	let host: HTMLDivElement;
	type Drop = { id: number; x: number; y: number; size: number };
	let drops: Drop[] = $state([]);
	let id = 0;

	function add(e: PointerEvent) {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) return;
		const r = host.getBoundingClientRect();
		const size = Math.max(r.width, r.height) * 1.6;
		const drop: Drop = {
			id: ++id,
			x: e.clientX - r.left - size / 2,
			y: e.clientY - r.top - size / 2,
			size
		};
		drops = [...drops, drop];
		setTimeout(() => {
			drops = drops.filter((d) => d.id !== drop.id);
		}, 600);
	}
</script>

<div
	bind:this={host}
	class={cn('relative overflow-hidden', cls)}
	onpointerdown={add}
	role="presentation"
>
	{@render children()}
	{#each drops as d (d.id)}
		<span
			class="bg-primary/30 pointer-events-none absolute rounded-full"
			style="left: {d.x}px; top: {d.y}px; width: {d.size}px; height: {d.size}px; animation: ripple 600ms var(--ease-out-expo) forwards;"
		></span>
	{/each}
</div>
