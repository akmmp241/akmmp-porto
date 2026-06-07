<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Variant = 'default' | 'secondary' | 'outline';
	type Props = HTMLAttributes<HTMLSpanElement> & {
		children: Snippet;
		variant?: Variant;
		class?: string;
	};
	let { children, variant = 'default', class: cls = '', ...rest }: Props = $props();

	const variants: Record<Variant, string> = {
		default: 'bg-primary text-primary-foreground border-transparent',
		secondary: 'bg-secondary/10 text-secondary-foreground border-transparent',
		outline: 'border-border text-foreground'
	};
</script>

<span
	{...rest}
	class={cn(
		'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
		variants[variant],
		cls
	)}
>
	{@render children()}
</span>
