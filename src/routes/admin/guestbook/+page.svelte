<script lang="ts">
	import { Check, X, Trash2, MessageSquare, AlertCircle } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let currentTab = $state<'pending' | 'approved'>('pending');
	let selectedIds = $state<number[]>([]);

	// Spring swipe feedback states
	let swipedId = $state<number | null>(null);
	let swipeDir = $state<'left' | 'right' | null>(null);
	let touchStartX = 0;

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	const activeList = $derived(currentTab === 'pending' ? data.pending : data.approved);
	const allIds = $derived(activeList.map((x) => x.id));
	const isAllSelected = $derived(activeList.length > 0 && selectedIds.length === activeList.length);

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

	// Moderation Swipes for mobile
	function handleTouchStart(e: TouchEvent, id: number) {
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchMove(e: TouchEvent, id: number) {
		const diff = e.touches[0].clientX - touchStartX;
		if (diff > 50) {
			// Swipe right (Approve)
			swipedId = id;
			swipeDir = 'right';
		} else if (diff < -50) {
			// Swipe left (Reject)
			swipedId = id;
			swipeDir = 'left';
		}
	}

	function handleTouchEnd() {
		// Reset after transition triggers
		setTimeout(() => {
			swipedId = null;
			swipeDir = null;
		}, 800);
	}
</script>

<svelte:head>
	<title>Guestbook Moderation — Admin</title>
</svelte:head>

<div class="mb-8 flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">Guestbook</h1>
	<p class="text-sm text-muted-foreground">Moderate messages left by visitors on your public guestbook page.</p>
</div>

<div class="flex flex-col gap-4">
	<!-- Tab toggles and bulk actions -->
	<div class="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => {
					currentTab = 'pending';
					selectedIds = [];
				}}
				class="relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentTab === 'pending' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}"
			>
				Pending Queue
				{#if data.pending.length > 0}
					<span class="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-bold text-primary">
						{data.pending.length}
					</span>
				{/if}
			</button>
			
			<button
				type="button"
				onclick={() => {
					currentTab = 'approved';
					selectedIds = [];
				}}
				class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {currentTab === 'approved' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent'}"
			>
				Approved Entries
			</button>
		</div>

		<!-- Bulk Actions -->
		{#if selectedIds.length > 0}
			<div class="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
				<span class="text-xs text-muted-foreground mr-2">{selectedIds.length} selected</span>

				<form method="POST" action="?/bulk" class="contents">
					<input type="hidden" name="ids" value={selectedIds.join(',')} />

					{#if currentTab === 'pending'}
						<button
							type="submit"
							name="action"
							value="approve"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
						>
							<Check class="h-3.5 w-3.5 text-emerald-500" /> Approve Selected
						</button>
						<button
							type="submit"
							name="action"
							value="reject"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
							onclick={(e) => { if (!confirm('Are you sure you want to reject and delete these entries?')) e.preventDefault(); }}
						>
							<X class="h-3.5 w-3.5 text-destructive" /> Reject Selected
						</button>
					{:else}
						<button
							type="submit"
							name="action"
							value="delete"
							class="inline-flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
							onclick={(e) => { if (!confirm('Are you sure you want to delete these approved entries?')) e.preventDefault(); }}
						>
							<Trash2 class="h-3.5 w-3.5" /> Delete Selected
						</button>
					{/if}
				</form>
			</div>
		{/if}
	</div>

	<!-- List / Table of entries -->
	<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
		{#if activeList.length === 0}
			<div class="grid place-items-center py-20 text-center text-sm text-muted-foreground">
				<MessageSquare class="h-8 w-8 text-muted-foreground/60 mb-2" />
				No guestbook entries here.
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
							<th class="px-4 py-3 text-left font-medium">Author</th>
							<th class="px-4 py-3 text-left font-medium">Message</th>
							<th class="px-4 py-3 text-left font-medium">Date</th>
							<th class="px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#each activeList as row (row.id)}
							<tr
								class="border-t border-border transition-all duration-300 hover:bg-muted/40 relative {swipedId === row.id && swipeDir === 'right' ? 'translate-x-full opacity-0 bg-emerald-500/10' : ''} {swipedId === row.id && swipeDir === 'left' ? '-translate-x-full opacity-0 bg-destructive/10' : ''}"
								ontouchstart={(e) => handleTouchStart(e, row.id)}
								ontouchmove={(e) => handleTouchMove(e, row.id)}
								ontouchend={handleTouchEnd}
							>
								<td class="px-4 py-3">
									<input
										type="checkbox"
										checked={selectedIds.includes(row.id)}
										onclick={() => toggleSelect(row.id)}
										class="rounded border-border text-primary focus:ring-primary"
									/>
								</td>
								<td class="px-4 py-3 font-medium whitespace-nowrap">
									<div class="flex flex-col">
										<span>{row.author}</span>
										{#if row.ipAddress}
											<span class="text-[10px] text-muted-foreground">IP: {row.ipAddress}</span>
										{/if}
									</div>
								</td>
								<td class="px-4 py-3 max-w-sm md:max-w-md break-words">
									{row.message}
								</td>
								<td class="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
									{formatDate(row.createdAt)}
								</td>
								<td class="px-4 py-3 text-right whitespace-nowrap">
									<div class="flex items-center justify-end gap-2">
										{#if currentTab === 'pending'}
											<form method="POST" action="?/approve" class="contents">
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-emerald-500 hover:text-white hover:bg-emerald-600 transition-colors cursor-pointer"
													title="Approve"
												>
													<Check class="h-4 w-4" />
												</button>
											</form>
											
											<form method="POST" action="?/reject" class="contents">
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-destructive hover:text-white hover:bg-destructive transition-colors cursor-pointer"
													title="Reject"
													onclick={(e) => { if (!confirm('Are you sure you want to reject this entry?')) e.preventDefault(); }}
												>
													<X class="h-4 w-4" />
												</button>
											</form>
										{:else}
											<form method="POST" action="?/delete" class="contents">
												<input type="hidden" name="id" value={row.id} />
												<button
													type="submit"
													class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
													title="Delete"
													onclick={(e) => { if (!confirm('Are you sure you want to delete this approved entry?')) e.preventDefault(); }}
												>
													<Trash2 class="h-4 w-4" />
												</button>
											</form>
										{/if}
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
