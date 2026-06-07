<script lang="ts">
	import { Plus, Pencil, Trash2, GripVertical, Briefcase, GraduationCap, Hammer, FlaskConical } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rows = $state(data.experiences);
	$effect(() => {
		rows = data.experiences;
	});

	let dragId = $state<number | null>(null);
	let overId = $state<number | null>(null);
	let confirmId = $state<number | null>(null);

	const typeIcon = {
		work: Briefcase,
		education: GraduationCap,
		intern: Hammer,
		project: FlaskConical
	} as const;

	function onDragStart(e: DragEvent, id: number) {
		dragId = id;
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	function onDragOver(e: DragEvent, id: number) {
		e.preventDefault();
		overId = id;
	}
	async function onDrop(e: DragEvent, targetId: number) {
		e.preventDefault();
		const sourceId = dragId;
		dragId = null;
		overId = null;
		if (sourceId == null || sourceId === targetId) return;
		const from = rows.findIndex((r) => r.id === sourceId);
		const to = rows.findIndex((r) => r.id === targetId);
		if (from < 0 || to < 0) return;
		const next = [...rows];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		rows = next;
		const ids = next.map((r) => r.id);
		const fd = new FormData();
		fd.set('ids', JSON.stringify(ids));
		await fetch('?/reorder', { method: 'POST', body: fd });
	}
</script>

<svelte:head><title>Experiences — Admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Experiences</h1>
		<p class="text-sm text-muted-foreground">{rows.length} entries. Drag to reorder.</p>
	</div>
	<a
		href="/admin/experiences/new"
		class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
	>
		<Plus class="h-4 w-4" /> New experience
	</a>
</div>

<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
	{#if rows.length === 0}
		<div class="grid place-items-center py-20 text-sm text-muted-foreground">
			No experiences yet.
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
				<tr>
					<th class="w-10 px-2 py-3"></th>
					<th class="px-4 py-3 text-left font-medium">Role</th>
					<th class="px-4 py-3 text-left font-medium">Company</th>
					<th class="px-4 py-3 text-left font-medium">Period</th>
					<th class="px-4 py-3 text-left font-medium">Type</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
					{@const Icon = typeIcon[row.type as keyof typeof typeIcon]}
					<tr
						draggable="true"
						ondragstart={(e) => onDragStart(e, row.id)}
						ondragover={(e) => onDragOver(e, row.id)}
						ondrop={(e) => onDrop(e, row.id)}
						ondragend={() => {
							dragId = null;
							overId = null;
						}}
						class={cn(
							'group border-t border-border transition-colors',
							dragId === row.id && 'opacity-40',
							overId === row.id && dragId !== row.id && 'bg-primary/5',
							'hover:bg-muted/40'
						)}
					>
						<td class="px-2 py-3 text-muted-foreground">
							<GripVertical class="h-4 w-4 cursor-grab active:cursor-grabbing" />
						</td>
						<td class="px-4 py-3 font-medium">{row.title}</td>
						<td class="px-4 py-3">
							<div class="flex flex-col">
								<span>{row.company}</span>
								{#if row.location}
									<span class="text-xs text-muted-foreground">{row.location}</span>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3 text-muted-foreground">
							{row.startDate}{row.current ? ' – Present' : row.endDate ? ` – ${row.endDate}` : ''}
						</td>
						<td class="px-4 py-3">
							<span
								class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
							>
								<Icon class="h-3 w-3" /> {row.type}
							</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<a
									href={`/admin/experiences/${row.id}`}
									class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
								>
									<Pencil class="h-4 w-4" />
								</a>
								{#if confirmId === row.id}
									<form method="POST" action="?/delete">
										<input type="hidden" name="id" value={row.id} />
										<button
											type="submit"
											class="inline-flex h-8 items-center gap-1 rounded-md bg-destructive px-2 text-xs font-medium text-white"
										>
											<Trash2 class="h-3 w-3" /> Confirm
										</button>
									</form>
									<button
										type="button"
										onclick={() => (confirmId = null)}
										class="text-xs text-muted-foreground hover:text-foreground"
									>
										Cancel
									</button>
								{:else}
									<button
										type="button"
										onclick={() => (confirmId = row.id)}
										class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 class="h-4 w-4" />
									</button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
