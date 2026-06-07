<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import {
		Plus,
		Pencil,
		Trash2,
		GripVertical,
		Star,
		StarOff,
		ExternalLink,
		Image as ImageIcon
	} from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let rows = $state(data.projects);
	$effect(() => {
		rows = data.projects;
	});

	let dragId = $state<number | null>(null);
	let overId = $state<number | null>(null);
	let confirmId = $state<number | null>(null);

	function onDragStart(e: DragEvent, id: number) {
		dragId = id;
		e.dataTransfer?.setData('text/plain', String(id));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
	}
	function onDragOver(e: DragEvent, id: number) {
		e.preventDefault();
		overId = id;
	}
	function onDrop(e: DragEvent, targetId: number) {
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
		persistOrder();
	}
	function onDragEnd() {
		dragId = null;
		overId = null;
	}

	async function persistOrder() {
		const ids = rows.map((r) => r.id);
		const fd = new FormData();
		fd.set('ids', JSON.stringify(ids));
		await fetch('?/reorder', { method: 'POST', body: fd });
	}
</script>

<svelte:head><title>Projects — Admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Projects</h1>
		<p class="text-sm text-muted-foreground">
			{rows.length} total. Drag rows to reorder.
		</p>
	</div>
	<a
		href="/admin/projects/new"
		class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
	>
		<Plus class="h-4 w-4" /> New project
	</a>
</div>

<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
	{#if rows.length === 0}
		<div class="grid place-items-center py-20 text-sm text-muted-foreground">
			<div class="flex flex-col items-center gap-3">
				<div
					class="grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed border-border bg-card/40"
				>
					<ImageIcon class="h-6 w-6 text-muted-foreground" />
				</div>
				<p>No projects yet.</p>
				<a href="/admin/projects/new" class="text-primary hover:underline">Create your first project →</a>
			</div>
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
				<tr>
					<th class="w-10 px-2 py-3"></th>
					<th class="px-4 py-3 text-left font-medium">Title</th>
					<th class="px-4 py-3 text-left font-medium">Slug</th>
					<th class="px-4 py-3 text-left font-medium">Stack</th>
					<th class="px-4 py-3 text-left font-medium">Featured</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.id)}
					<tr
						draggable="true"
						ondragstart={(e) => onDragStart(e, row.id)}
						ondragover={(e) => onDragOver(e, row.id)}
						ondrop={(e) => onDrop(e, row.id)}
						ondragend={onDragEnd}
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
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								{#if row.image}
									<img
										src={row.image}
										alt=""
										class="h-9 w-9 rounded-md object-cover ring-1 ring-border"
										loading="lazy"
									/>
								{:else}
									<div
										class="grid h-9 w-9 place-items-center rounded-md bg-muted text-muted-foreground"
									>
										<ImageIcon class="h-4 w-4" />
									</div>
								{/if}
								<span class="font-medium">{row.title}</span>
							</div>
						</td>
						<td class="px-4 py-3 text-muted-foreground">{row.slug}</td>
						<td class="px-4 py-3">
							<div class="flex flex-wrap gap-1">
								{#each row.techstack.slice(0, 3) as t (t)}
									<span class="rounded bg-muted px-1.5 py-0.5 text-[10px]">{t}</span>
								{/each}
								{#if row.techstack.length > 3}
									<span class="text-[10px] text-muted-foreground"
										>+{row.techstack.length - 3}</span
									>
								{/if}
							</div>
						</td>
						<td class="px-4 py-3">
							<form method="POST" action="?/toggleFeatured" use:enhance={() => async ({ result, update }) => { await update({ reset: false }); }}>
								<input type="hidden" name="id" value={row.id} />
								<input type="hidden" name="value" value={String(!row.featured)} />
								<button
									type="submit"
									aria-label={row.featured ? 'Unfeature' : 'Feature'}
									class={cn(
										'transition-colors',
										row.featured ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
									)}
								>
									{#if row.featured}
										<Star class="h-4 w-4 fill-current" />
									{:else}
										<StarOff class="h-4 w-4" />
									{/if}
								</button>
							</form>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<a
									href={`/admin/projects/${row.id}`}
									class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
									aria-label="Edit"
								>
									<Pencil class="h-4 w-4" />
								</a>
								{#if confirmId === row.id}
									<form method="POST" action="?/delete" use:enhance>
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
										class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
										aria-label="Delete"
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
