<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Variant = 'primary' | 'ghost' | 'outline';
	type Size = 'sm' | 'md' | 'lg';

	type Props = (HTMLButtonAttributes | HTMLAnchorAttributes) & {
		children: Snippet;
		variant?: Variant;
		size?: Size;
		href?: string;
		class?: string;
	};

	let {
		children,
		variant = 'primary',
		size = 'md',
		href,
		class: cls = '',
		...rest
	}: Props = $props();

	const variants: Record<Variant, string> = {
		primary: 'bg-primary text-primary-foreground hover:opacity-90',
		ghost: 'bg-transparent hover:bg-accent hover:text-accent-foreground',
		outline: 'border border-border bg-transparent hover:bg-accent hover:text-accent-foreground'
	};
	const sizes: Record<Size, string> = {
		sm: 'h-8 px-3 text-sm',
		md: 'h-10 px-5 text-sm',
		lg: 'h-12 px-6 text-base'
	};
	const base =
		'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
</script>

{#if href}
	<a {href} {...rest as HTMLAnchorAttributes} class={cn(base, variants[variant], sizes[size], cls)}>
		{@render children()}
	</a>
{:else}
	<button {...rest as HTMLButtonAttributes} class={cn(base, variants[variant], sizes[size], cls)}>
		{@render children()}
	</button>
{/if}
