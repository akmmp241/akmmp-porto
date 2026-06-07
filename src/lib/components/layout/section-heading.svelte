<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';

	let {
		children,
		id,
		class: cls = ''
	}: { children: Snippet; id?: string; class?: string } = $props();
</script>

<div {id} class={cn('flex flex-1 items-center gap-4', cls)}>
	<h1 class="text-3xl font-medium tracking-wide md:text-4xl">
		<span class="text-primary">#</span>{@render children()}
	</h1>
	<div class="bg-primary h-0.5 w-1/5 md:w-2/5"></div>
</div>
