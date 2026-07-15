<script lang="ts">
	import { Copy, KeyRound, Plus, ShieldOff } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let copied = false;
	async function copyKey(key: string) {
		await navigator.clipboard.writeText(key);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<svelte:head><title>API keys — Admin</title></svelte:head>

<div class="mb-6 flex items-start justify-between gap-4">
	<div>
		<h1 class="text-2xl font-semibold tracking-tight">API keys</h1>
		<p class="text-sm text-muted-foreground">Create Bearer keys for the blog MCP HTTP API.</p>
	</div>
</div>

{#if form?.created}
	<section class="mb-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
		<p class="mb-2 text-sm font-medium text-amber-200">Copy this key now. It will not be shown again.</p>
		<div class="flex gap-2">
			<code class="flex-1 overflow-x-auto rounded-md bg-background px-3 py-2 text-xs">{form.created.rawKey}</code>
			<button class="inline-flex items-center gap-2 rounded-md border border-border px-3 text-xs hover:bg-accent" onclick={() => copyKey(form.created.rawKey)}>
				<Copy class="h-4 w-4" /> {copied ? 'Copied' : 'Copy'}
			</button>
		</div>
	</section>
{/if}

{#if form?.error}
	<p class="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{form.error}</p>
{/if}

<div class="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
	<form method="POST" action="?/create" use:enhance class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center gap-2">
			<KeyRound class="h-4 w-4" />
			<h2 class="text-sm font-medium">Create key</h2>
		</div>
		<label class="mb-4 flex flex-col gap-1.5">
			<span class="text-xs font-medium text-muted-foreground">Label</span>
			<input name="label" class="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary" placeholder="Claude Desktop" />
		</label>
		<div class="mb-5 space-y-2">
			<p class="text-xs font-medium text-muted-foreground">Scopes</p>
			{#each data.scopes as scope}
				<label class="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
					<input type="checkbox" name="scopes" value={scope} checked />
					<span>{scope}</span>
				</label>
			{/each}
		</div>
		<button class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:-translate-y-0.5">
			<Plus class="h-4 w-4" /> Create key
		</button>
	</form>

	<section class="rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<h2 class="mb-4 text-sm font-medium">Keys</h2>
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm">
				<thead class="text-xs text-muted-foreground">
					<tr class="border-b border-border">
						<th class="py-2 pr-4 font-medium">Label</th>
						<th class="py-2 pr-4 font-medium">Prefix</th>
						<th class="py-2 pr-4 font-medium">Scopes</th>
						<th class="py-2 pr-4 font-medium">Last used</th>
						<th class="py-2 pr-4 font-medium">Status</th>
						<th class="py-2 font-medium"></th>
					</tr>
				</thead>
				<tbody>
					{#each data.keys as key}
						<tr class="border-b border-border/60">
							<td class="py-3 pr-4">{key.label}</td>
							<td class="py-3 pr-4"><code class="text-xs">{key.prefix}…</code></td>
							<td class="py-3 pr-4 text-xs text-muted-foreground">{key.scopes.join(', ')}</td>
							<td class="py-3 pr-4 text-muted-foreground">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}</td>
							<td class="py-3 pr-4">{key.revokedAt ? 'Revoked' : 'Active'}</td>
							<td class="py-3">
								{#if !key.revokedAt}
									<form method="POST" action="?/revoke" use:enhance>
										<input type="hidden" name="id" value={key.id} />
										<button class="inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10">
											<ShieldOff class="h-3.5 w-3.5" /> Revoke
										</button>
									</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</div>
