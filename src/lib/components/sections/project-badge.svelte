<script lang="ts">
	import { ExternalLink } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import Link from '$lib/components/ui/link.svelte';

	type Variant = 'fe' | 'be' | 'live';
	let { variant, href }: { variant: Variant; href: string } = $props();

	const labels: Record<Variant, string> = {
		fe: 'FE Repo',
		be: 'BE Repo',
		live: 'Live'
	};
</script>

<Link
	{href}
	class="border-primary hover:border-muted-foreground hover:text-muted-foreground flex min-w-28 items-center justify-center gap-1 border p-2 text-sm font-medium transition-colors"
>
	{#if variant === 'live'}
		<ExternalLink size={14} />
	{:else}
		<Github size={14} />
	{/if}
	{labels[variant]}
</Link>
