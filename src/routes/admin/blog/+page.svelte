<script lang="ts">
	import { Plus, Pencil, Trash2, FileText, Eye, EyeOff, Clock } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let confirmId = $state<number | null>(null);

	function fmt(d: Date | string | null) {
		if (!d) return '—';
		return new Date(d).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head><title>Blog — Admin</title></svelte:head>

<div class="mb-6 flex items-end justify-between">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">Blog posts</h1>
		<p class="text-sm text-muted-foreground">
			{data.posts.length} entries · {data.posts.filter((p) => p.published).length} published
		</p>
	</div>
	<a
		href="/admin/blog/new"
		class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg"
	>
		<Plus class="h-4 w-4" /> New post
	</a>
</div>

<div class="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
	{#if data.posts.length === 0}
		<div class="grid place-items-center gap-2 py-20 text-center text-sm text-muted-foreground">
			<FileText class="h-8 w-8 opacity-40" />
			<p>No posts yet.</p>
			<a href="/admin/blog/new" class="text-primary hover:underline">Write your first one →</a>
		</div>
	{:else}
		<table class="w-full text-sm">
			<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
				<tr>
					<th class="px-4 py-3 text-left font-medium">Title</th>
					<th class="px-4 py-3 text-left font-medium">Slug</th>
					<th class="px-4 py-3 text-left font-medium">Status</th>
					<th class="px-4 py-3 text-left font-medium">Published</th>
					<th class="px-4 py-3 text-left font-medium">Updated</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody>
				{#each data.posts as post (post.id)}
					<tr class="group border-t border-border transition-colors hover:bg-muted/40">
						<td class="px-4 py-3">
							<a
								href={`/admin/blog/${post.id}`}
								class="font-medium hover:text-primary"
							>
								{post.title.en}
							</a>
							<div class="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
								<Clock class="h-3 w-3" /> {post.readingTime} min read
							</div>
						</td>
						<td class="px-4 py-3 font-mono text-xs text-muted-foreground">{post.slug}</td>
						<td class="px-4 py-3">
							<form method="POST" action="?/togglePublish" class="contents">
								<input type="hidden" name="id" value={post.id} />
								<input type="hidden" name="value" value={String(!post.published)} />
								<button
									type="submit"
									class={cn(
										'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors',
										post.published
											? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-300'
											: 'bg-muted text-muted-foreground hover:bg-accent'
									)}
								>
									{#if post.published}
										<Eye class="h-3 w-3" /> Published
									{:else}
										<EyeOff class="h-3 w-3" /> Draft
									{/if}
								</button>
							</form>
						</td>
						<td class="px-4 py-3 text-muted-foreground">{fmt(post.publishedAt)}</td>
						<td class="px-4 py-3 text-muted-foreground">{fmt(post.updatedAt)}</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
								<a
									href={`/admin/blog/${post.id}`}
									class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
								>
									<Pencil class="h-4 w-4" />
								</a>
								{#if confirmId === post.id}
									<form method="POST" action="?/delete">
										<input type="hidden" name="id" value={post.id} />
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
										onclick={() => (confirmId = post.id)}
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
