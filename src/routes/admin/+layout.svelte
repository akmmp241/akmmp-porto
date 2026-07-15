<script lang="ts">
	import '../../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import type { LayoutData } from './$types';
	import AdminShell from '$lib/components/admin/admin-shell.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();
</script>

<ModeWatcher />

{#if data.user}
	<AdminShell user={data.user}>
		{@render children()}
	</AdminShell>
{:else}
	{@render children()}
{/if}
