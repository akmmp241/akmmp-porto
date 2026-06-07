<script lang="ts">
	import '../../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import type { LayoutData } from './$types';
	import AdminShell from '$lib/components/admin/admin-shell.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const isLogin = $derived(page.url.pathname === '/admin/login');
</script>

<ModeWatcher />

{#if isLogin}
	{@render children()}
{:else if data.user}
	<AdminShell user={data.user}>
		{@render children()}
	</AdminShell>
{/if}
