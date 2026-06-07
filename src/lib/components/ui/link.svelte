<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes & {
		children: Snippet;
		href: string;
		external?: boolean;
		class?: string;
	};
	let { children, href, external, class: cls = '', ...rest }: Props = $props();

	const isExternal = $derived(external ?? /^https?:\/\//.test(href) ?? href.startsWith('mailto:'));
</script>

<a
	{href}
	{...rest}
	target={isExternal ? '_blank' : undefined}
	rel={isExternal ? 'noopener noreferrer' : undefined}
	class={cn(
		'hover:text-primary focus-visible:ring-primary focus-visible:ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
		cls
	)}
>
	{@render children()}
</a>
