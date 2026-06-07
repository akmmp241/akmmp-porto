<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		children,
		class: cls = '',
		onclick,
		...rest
	}: {
		children: import('svelte').Snippet;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		[k: string]: unknown;
	} = $props();
</script>

<button
	{...rest}
	{onclick}
	class={cn(
		'group border-muted-foreground bg-background text-foreground relative w-auto cursor-pointer overflow-hidden rounded-full border p-2 px-6 text-center font-semibold',
		cls
	)}
>
	<div class="flex items-center gap-2">
		<div
			class="bg-primary h-2 w-2 rounded-full transition-all duration-300 group-hover:scale-[100.8]"
		></div>
		<span
			class="inline-block transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0"
		>
			{@render children()}
		</span>
	</div>
	<div
		class="text-primary-foreground absolute inset-0 z-10 flex h-full w-full translate-x-12 items-center justify-center gap-2 opacity-0 transition-all duration-300 group-hover:-translate-x-5 group-hover:opacity-100"
	>
		<span>{@render children()}</span>
		<span>==&gt;</span>
	</div>
</button>
