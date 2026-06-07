<script lang="ts">
	import { FolderKanban, Briefcase, Wrench, Sparkles, Pencil, MessageSquare, BookOpen } from '@lucide/svelte';
	import CountUp from '$lib/components/fx/count-up.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const cards = $derived([
		{ label: 'Projects', value: data.stats.projects, icon: FolderKanban, accent: 'text-primary' },
		{ label: 'Featured', value: data.stats.featured, icon: Sparkles, accent: 'text-amber-500' },
		{
			label: 'Experiences',
			value: data.stats.experiences,
			icon: Briefcase,
			accent: 'text-emerald-500'
		},
		{ label: 'Skill groups', value: data.stats.skillGroups, icon: Wrench, accent: 'text-sky-500' },
		{ label: 'Unread Messages', value: data.stats.unreadMessages, icon: MessageSquare, accent: 'text-rose-500' },
		{ label: 'Pending Guestbook', value: data.stats.pendingGuestbook, icon: BookOpen, accent: 'text-violet-500' }
	]);

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Dashboard — Admin</title>
</svelte:head>

<div class="mb-8 flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">Overview</h1>
	<p class="text-sm text-muted-foreground">Snapshot of your portfolio content.</p>
</div>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
	{#each cards as c (c.label)}
		<div
			class="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
		>
			<div class="flex items-start justify-between">
				<div>
					<p class="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
					<div class="mt-2 text-3xl font-semibold tabular-nums">
						<CountUp to={c.value} />
					</div>
				</div>
				<div
					class="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:rotate-6"
				>
					<c.icon class={'h-5 w-5 ' + c.accent} />
				</div>
			</div>
		</div>
	{/each}
</div>

<div class="mt-10">
	<div class="mb-3 flex items-center justify-between">
		<h2 class="text-base font-semibold">Recently updated</h2>
		<a
			href="/admin/projects"
			class="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
		>
			View all projects
		</a>
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
		{#if data.recentProjects.length === 0}
			<div
				class="grid place-items-center py-16 text-center text-sm text-muted-foreground"
			>
				No projects yet. <a href="/admin/projects/new" class="ml-1 text-primary hover:underline">Create one →</a>
			</div>
		{:else}
			<table class="w-full text-sm">
				<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
					<tr>
						<th class="px-4 py-3 text-left font-medium">Title</th>
						<th class="px-4 py-3 text-left font-medium">Slug</th>
						<th class="px-4 py-3 text-left font-medium">Featured</th>
						<th class="px-4 py-3 text-left font-medium">Updated</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentProjects as row (row.id)}
						<tr class="border-t border-border transition-colors hover:bg-muted/40">
							<td class="px-4 py-3 font-medium">{row.title}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.slug}</td>
							<td class="px-4 py-3">
								{#if row.featured}
									<span
										class="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-300"
										>Featured</span
									>
								{:else}
									<span class="text-xs text-muted-foreground">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-muted-foreground">{formatDate(row.updatedAt)}</td>
							<td class="px-4 py-3 text-right">
								<a
									href={`/admin/projects/${row.id}`}
									class="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
								>
									<Pencil class="h-3.5 w-3.5" /> Edit
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
