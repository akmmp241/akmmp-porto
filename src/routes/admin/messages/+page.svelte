<script lang="ts">
	import { page } from '$app/state';
	import { Mail, Check, Archive, Trash2, Eye, Reply } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let selectedIds = $state<number[]>([]);

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const allIds = $derived(data.messages.map((m) => m.id));
	const isAllSelected = $derived(data.messages.length > 0 && selectedIds.length === data.messages.length);

	function toggleSelectAll() {
		if (isAllSelected) {
			selectedIds = [];
		} else {
			selectedIds = [...allIds];
		}
	}

	function toggleSelect(id: number) {
		if (selectedIds.includes(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}
</script>

<svelte:head>
	<title>Messages — Admin</title>
</svelte:head>

<div class="mb-8 flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">Messages</h1>
	<p class="text-sm text-muted-foreground">Manage your portfolio contact form submissions.</p>
</div>

<div class="flex flex-col gap-4">
	<!-- Tab filters and bulk actions -->
	<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
		<div class="flex gap-2">
			<a
				href="?tab=unread"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.tab === 'unread' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}"
			>
				Unread
			</a>
			<a
				href="?tab=all"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.tab === 'all' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}"
			>
				All
			</a>
			<a
				href="?tab=archived"
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.tab === 'archived' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}"
			>
				Archived
			</a>
		</div>

		<!-- Bulk Actions -->
		{#if selectedIds.length > 0}
			<div class="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
				<span class="text-xs text-muted-foreground mr-2">{selectedIds.length} selected</span>
				
				<form method="POST" action="?/bulk" class="contents">
					<input type="hidden" name="ids" value={selectedIds.join(',')} />
					
					{#if data.tab !== 'archived'}
						<button
							type="submit"
							name="action"
							value="read"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
						>
							<Check class="h-3.5 w-3.5" /> Mark Read
						</button>
						<button
							type="submit"
							name="action"
							value="archive"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
						>
							<Archive class="h-3.5 w-3.5" /> Archive
						</button>
					{/if}

					<button
						type="submit"
						name="action"
						value="delete"
						class="inline-flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
						onclick={(e) => { if (!confirm('Are you sure you want to delete these selected messages?')) e.preventDefault(); }}
					>
						<Trash2 class="h-3.5 w-3.5" /> Delete
					</button>
				</form>
			</div>
		{/if}
	</div>

	<!-- Inbox list -->
	<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
		{#if data.messages.length === 0}
			<div class="grid place-items-center py-20 text-center text-sm text-muted-foreground">
				<Mail class="h-8 w-8 text-muted-foreground/60 mb-2" />
				No messages in this folder.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
						<tr>
							<th class="w-10 px-4 py-3 text-left">
								<input
									type="checkbox"
									checked={isAllSelected}
									onclick={toggleSelectAll}
									class="rounded border-border text-primary focus:ring-primary"
								/>
							</th>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Subject</th>
							<th class="px-4 py-3 text-left font-medium">Date</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.messages as row (row.id)}
							<tr
								class="border-t border-border transition-colors hover:bg-muted/40 {row.read ? 'text-muted-foreground bg-card/10' : 'font-medium text-foreground bg-primary/5'}"
							>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										checked={selectedIds.includes(row.id)}
										onclick={() => toggleSelect(row.id)}
										class="rounded border-border text-primary focus:ring-primary"
									/>
								</td>
								<td class="px-4 py-3 max-w-[150px] truncate">
									<span class="flex items-center gap-1.5">
										{#if !row.read}
											<span class="h-2 w-2 rounded-full bg-primary shrink-0"></span>
										{/if}
										{row.name}
									</span>
								</td>
								<td class="px-4 py-3 max-w-[300px] truncate">
									<div class="flex flex-col">
										<span>{row.subject || 'No Subject'}</span>
										<span class="text-xs text-muted-foreground truncate">{row.message}</span>
									</div>
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
									{formatDate(row.createdAt)}
								</td>
								<td class="px-4 py-3 text-right whitespace-nowrap">
									<div class="flex items-center justify-end gap-2">
										<a
											href={`/admin/messages/${row.id}`}
											class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
											title="View Message"
										>
											<Eye class="h-4 w-4" />
										</a>
										<a
											href={`mailto:${row.email}?subject=Re: ${encodeURIComponent(row.subject || 'Portfolio Contact')}`}
											class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
											title="Reply"
										>
											<Reply class="h-4 w-4" />
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
