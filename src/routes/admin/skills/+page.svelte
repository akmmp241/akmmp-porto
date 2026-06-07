<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Plus, Trash2, GripVertical, Save, Loader2, X } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let groups = $state(data.groups);
	$effect(() => {
		groups = data.groups;
	});

	let dragId = $state<number | null>(null);
	let overId = $state<number | null>(null);

	const { form: newForm, errors, enhance, submitting, reset } = superForm(data.newForm, {
		dataType: 'json',
		resetForm: true,
		onUpdated: ({ form }) => {
			if (form.valid) invalidateAll();
		}
	});

	type Editing = {
		titleEn: string;
		titleId: string;
		items: string;
		saving: boolean;
	};
	let editing = $state<Record<number, Editing>>({});

	function startEdit(id: number, t: { en: string; id: string }, items: string[]) {
		editing[id] = {
			titleEn: t.en,
			titleId: t.id,
			items: items.join(', '),
			saving: false
		};
	}

	async function save(id: number) {
		const e = editing[id];
		if (!e) return;
		e.saving = true;
		const fd = new FormData();
		fd.set('id', String(id));
		fd.set('titleEn', e.titleEn);
		fd.set('titleId', e.titleId);
		fd.set('items', e.items);
		await fetch('?/update', { method: 'POST', body: fd });
		await invalidateAll();
		delete editing[id];
		editing = { ...editing };
	}

	async function remove(id: number) {
		if (!confirm('Delete this skill group?')) return;
		const fd = new FormData();
		fd.set('id', String(id));
		await fetch('?/delete', { method: 'POST', body: fd });
		await invalidateAll();
	}

	function onDragStart(e: DragEvent, id: number) {
		dragId = id;
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
		const from = groups.findIndex((g) => g.id === sourceId);
		const to = groups.findIndex((g) => g.id === targetId);
		if (from < 0 || to < 0) return;
		const next = [...groups];
		const [moved] = next.splice(from, 1);
		next.splice(to, 0, moved);
		groups = next;
		const ids = next.map((g) => g.id);
		const fd = new FormData();
		fd.set('ids', JSON.stringify(ids));
		await fetch('?/reorder', { method: 'POST', body: fd });
	}
</script>

<svelte:head><title>Skills — Admin</title></svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-semibold tracking-tight">Skill groups</h1>
	<p class="text-sm text-muted-foreground">Manage tech stack categories. Drag to reorder.</p>
</div>

<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
	<div class="space-y-3 lg:col-span-2">
		{#each groups as g (g.id)}
			{@const isEditing = editing[g.id] !== undefined}
			<div
				draggable={!isEditing}
				ondragstart={(e) => onDragStart(e, g.id)}
				ondragover={(e) => onDragOver(e, g.id)}
				ondrop={(e) => onDrop(e, g.id)}
				ondragend={() => {
					dragId = null;
					overId = null;
				}}
				class={cn(
					'group rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm transition-all',
					dragId === g.id && 'opacity-40',
					overId === g.id && dragId !== g.id && 'ring-2 ring-primary/40'
				)}
			>
				{#if isEditing}
					<div class="space-y-3">
						<div class="grid grid-cols-2 gap-2">
							<input
								bind:value={editing[g.id].titleEn}
								placeholder="Title (en)"
								class="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
							/>
							<input
								bind:value={editing[g.id].titleId}
								placeholder="Title (id)"
								class="h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
							/>
						</div>
						<input
							bind:value={editing[g.id].items}
							placeholder="Items, comma separated"
							class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
						/>
						<div class="flex justify-end gap-2">
							<button
								type="button"
								onclick={() => {
									delete editing[g.id];
									editing = { ...editing };
								}}
								class="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-card px-3 text-xs hover:bg-accent"
							>
								<X class="h-3.5 w-3.5" /> Cancel
							</button>
							<button
								type="button"
								disabled={editing[g.id].saving}
								onclick={() => save(g.id)}
								class="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
							>
								{#if editing[g.id].saving}
									<Loader2 class="h-3.5 w-3.5 animate-spin" />
								{:else}
									<Save class="h-3.5 w-3.5" />
								{/if}
								Save
							</button>
						</div>
					</div>
				{:else}
					<div class="flex items-start gap-3">
						<GripVertical
							class="mt-1 h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing"
						/>
						<div class="flex-1">
							<div class="flex items-baseline gap-2">
								<h3 class="text-sm font-semibold">{g.title.en}</h3>
								<span class="text-xs text-muted-foreground">/ {g.title.id}</span>
							</div>
							<div class="mt-2 flex flex-wrap gap-1">
								{#each g.items as item (item)}
									<span class="rounded bg-muted px-2 py-0.5 text-xs">{item}</span>
								{/each}
							</div>
						</div>
						<div class="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
							<button
								type="button"
								onclick={() => startEdit(g.id, g.title, g.items)}
								class="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
							>
								Edit
							</button>
							<button
								type="button"
								onclick={() => remove(g.id)}
								class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2 class="h-4 w-4" />
							</button>
						</div>
					</div>
				{/if}
			</div>
		{:else}
			<div class="rounded-xl border-2 border-dashed border-border bg-card/30 p-10 text-center text-sm text-muted-foreground">
				No skill groups yet.
			</div>
		{/each}
	</div>

	<aside>
		<form
			method="POST"
			action="?/create"
			use:enhance
			class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm"
		>
			<h2 class="mb-4 flex items-center gap-2 text-sm font-medium">
				<Plus class="h-4 w-4 text-primary" /> Add new group
			</h2>
			<div class="space-y-3">
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Title (English)</span>
					<input
						name="titleEn"
						bind:value={$newForm.titleEn}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$errors.titleEn && 'border-destructive'
						)}
					/>
					{#if $errors.titleEn}<p class="text-xs text-destructive">{$errors.titleEn[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground">Title (Indonesian)</span>
					<input
						name="titleId"
						bind:value={$newForm.titleId}
						class={cn(
							'h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary',
							$errors.titleId && 'border-destructive'
						)}
					/>
					{#if $errors.titleId}<p class="text-xs text-destructive">{$errors.titleId[0]}</p>{/if}
				</label>
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-medium text-muted-foreground"
						>Items <span class="font-normal opacity-60">(comma separated)</span></span
					>
					<input
						name="items"
						bind:value={$newForm.items}
						placeholder="React, Vue, Svelte"
						class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
					/>
				</label>
				<button
					type="submit"
					disabled={$submitting}
					class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 disabled:opacity-70"
				>
					{#if $submitting}
						<Loader2 class="h-4 w-4 animate-spin" /> Adding…
					{:else}
						<Plus class="h-4 w-4" /> Add group
					{/if}
				</button>
			</div>
		</form>
	</aside>
</div>
