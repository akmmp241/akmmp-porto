<script lang="ts">
	import { Calendar, ShieldAlert, ChevronLeft, ChevronRight, Filter } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}

	function handleActionFilterChange(e: Event) {
		const select = e.target as HTMLSelectElement;
		const val = select.value;
		if (val) {
			goto(`?action=${encodeURIComponent(val)}`);
		} else {
			goto('?');
		}
	}
</script>

<svelte:head>
	<title>Audit Logs — Admin</title>
</svelte:head>

<div class="mb-8 flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">Audit Logs</h1>
	<p class="text-sm text-muted-foreground">Append-only administrative operations log.</p>
</div>

<div class="flex flex-col gap-4">
	<!-- Filter Bar -->
	<div class="flex items-center gap-4 rounded-lg border border-border bg-card/20 p-4 backdrop-blur-sm">
		<div class="flex items-center gap-2 text-sm text-muted-foreground">
			<Filter class="h-4 w-4" />
			<span>Filter by action:</span>
		</div>
		<select
			value={data.selectedAction}
			onchange={handleActionFilterChange}
			class="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-0"
		>
			<option value="">All Actions</option>
			{#each data.distinctActions as act}
				<option value={act}>{act}</option>
			{/each}
		</select>
	</div>

	<!-- Log table -->
	<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
		{#if data.logs.length === 0}
			<div class="grid place-items-center py-20 text-center text-sm text-muted-foreground">
				<ShieldAlert class="h-8 w-8 text-muted-foreground/60 mb-2" />
				No audit logs found.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
						<tr>
							<th class="px-4 py-3 text-left font-medium">Timestamp</th>
							<th class="px-4 py-3 text-left font-medium">User</th>
							<th class="px-4 py-3 text-left font-medium">Action</th>
							<th class="px-4 py-3 text-left font-medium">Target</th>
							<th class="px-4 py-3 text-left font-medium">IP Address</th>
							<th class="px-4 py-3 text-left font-medium">Metadata</th>
						</tr>
					</thead>
					<tbody>
						{#each data.logs as row (row.id)}
							<tr class="border-t border-border transition-colors hover:bg-muted/40">
								<td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
									{formatDate(row.createdAt)}
								</td>
								<td class="px-4 py-3 whitespace-nowrap">
									<div class="flex flex-col">
										<span class="font-medium">{row.userName || 'System'}</span>
										{#if row.userEmail}
											<span class="text-xs text-muted-foreground">{row.userEmail}</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 whitespace-nowrap">
									<span class="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
										{row.action}
									</span>
								</td>
								<td class="px-4 py-3 text-muted-foreground max-w-[120px] truncate whitespace-nowrap" title={row.target}>
									{row.target || '—'}
								</td>
								<td class="px-4 py-3 text-muted-foreground whitespace-nowrap">
									{row.ipAddress || '—'}
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground">
									{#if row.metadata && Object.keys(row.metadata).length > 0}
										<pre class="max-w-[200px] overflow-hidden truncate font-mono text-[10px] bg-background/50 p-1 rounded border border-border" title={JSON.stringify(row.metadata, null, 2)}>{JSON.stringify(row.metadata)}</pre>
									{:else}
										<span class="text-muted-foreground/50">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-4 mt-6">
			<a
				href="?page={data.pagination.page - 1}{data.selectedAction ? '&action=' + encodeURIComponent(data.selectedAction) : ''}"
				class="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors {data.pagination.page === 1 ? 'pointer-events-none opacity-50' : ''}"
			>
				<ChevronLeft class="h-4 w-4" /> Previous
			</a>
			<span class="text-sm text-muted-foreground">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</span>
			<a
				href="?page={data.pagination.page + 1}{data.selectedAction ? '&action=' + encodeURIComponent(data.selectedAction) : ''}"
				class="flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-accent transition-colors {data.pagination.page === data.pagination.totalPages ? 'pointer-events-none opacity-50' : ''}"
			>
				Next <ChevronRight class="h-4 w-4" />
			</a>
		</div>
	{/if}
</div>
