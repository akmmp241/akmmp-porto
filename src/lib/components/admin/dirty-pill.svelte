<script lang="ts">
	import { dirty } from '$lib/stores/dirty';
	import { CircleAlert } from '@lucide/svelte';

	const count = $derived($dirty.size);

	function handleBeforeUnload(e: BeforeUnloadEvent) {
		if (count > 0) {
			e.preventDefault();
			e.returnValue = '';
		}
	}
</script>

<svelte:window on:beforeunload={handleBeforeUnload} />

{#if count > 0}
	<div
		class="pointer-events-none fixed top-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-lg backdrop-blur-md dark:text-amber-300"
		role="status"
	>
		<CircleAlert class="h-3.5 w-3.5" />
		<span>Unsaved changes</span>
	</div>
{/if}
