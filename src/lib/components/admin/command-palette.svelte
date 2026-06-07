<script lang="ts">
	import { goto } from '$app/navigation';
	import { Search, ArrowRight } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';

	type NavItem = { href: string; label: string };

	let {
		open = $bindable(false),
		nav
	}: { open?: boolean; nav: NavItem[] } = $props();

	let q = $state('');
	let active = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	const quick: NavItem[] = [
		{ href: '/admin/projects/new', label: 'Create new project' },
		{ href: '/admin/experiences/new', label: 'Create new experience' },
		{ href: '/admin/skills', label: 'Manage skills' },
		{ href: '/admin/settings', label: 'Site settings' }
	];

	const all = $derived([...nav, ...quick]);
	const results = $derived(
		q.trim() === ''
			? all
			: all.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase()))
	);

	$effect(() => {
		if (open) {
			q = '';
			active = 0;
			setTimeout(() => inputEl?.focus(), 30);
		}
	});

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = Math.min(results.length - 1, active + 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = Math.max(0, active - 1);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			const target = results[active];
			if (target) pick(target);
		}
	}

	function pick(item: NavItem) {
		open = false;
		goto(item.href);
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 grid place-items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm"
		role="presentation"
		onclick={(e) => {
			if (e.target === e.currentTarget) open = false;
		}}
	>
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Command palette"
			class="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
		>
			<div class="flex items-center gap-2 border-b border-border px-4">
				<Search class="h-4 w-4 text-muted-foreground" />
				<input
					bind:this={inputEl}
					bind:value={q}
					onkeydown={handleKey}
					type="text"
					placeholder="Type a command or search…"
					class="h-12 flex-1 bg-transparent text-sm outline-none"
				/>
				<kbd
					class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
					>esc</kbd
				>
			</div>

			<ul class="max-h-80 overflow-y-auto p-2" role="listbox">
				{#each results as item, i (item.href + item.label)}
					<li>
						<button
							type="button"
							role="option"
							aria-selected={i === active}
							onmouseenter={() => (active = i)}
							onclick={() => pick(item)}
							class={cn(
								'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
								i === active
									? 'bg-primary/10 text-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
						>
							<span class="flex-1 truncate">{item.label}</span>
							<span class="text-[11px] text-muted-foreground">{item.href}</span>
							<ArrowRight class="h-3.5 w-3.5 opacity-60" />
						</button>
					</li>
				{:else}
					<li class="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}
