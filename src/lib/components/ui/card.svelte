<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		children: Snippet;
		class?: string;
	};
	let { children, class: cls = '', ...rest }: Props = $props();
</script>

<div
	{...rest}
	class={cn('border-border bg-card text-card-foreground rounded-md border shadow-sm', cls)}
>
	{@render children()}
</div>
