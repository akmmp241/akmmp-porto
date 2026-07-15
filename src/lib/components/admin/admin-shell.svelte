<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		LayoutDashboard,
		FolderKanban,
		Briefcase,
		Wrench,
		Settings2,
		LogOut,
		Search,
		PanelLeftClose,
		PanelLeftOpen,
		Sun,
		Moon,
		FileText,
		Mail,
		MessageSquare,
		ScrollText,
		BarChart3
	} from '@lucide/svelte';
	import { mode, toggleMode } from 'mode-watcher';
	import { cn } from '$lib/utils/cn';
	import type { SafeUser } from '$lib/server/auth';
	import CommandPalette from './command-palette.svelte';
	import DirtyPill from './dirty-pill.svelte';

	type BadgeKey = 'unreadMessages' | 'pendingGuestbook';

	let {
		user,
		unreadMessages = 0,
		pendingGuestbook = 0,
		children
	}: {
		user: SafeUser;
		unreadMessages?: number;
		pendingGuestbook?: number;
		children: import('svelte').Snippet;
	} = $props();

	const badgeCounts: Record<BadgeKey, number> = {
		unreadMessages,
		pendingGuestbook
	};

	let collapsed = $state(false);
	let paletteOpen = $state(false);

	const nav: Array<{
		href: string;
		label: string;
		icon: typeof LayoutDashboard;
		exact?: boolean;
		badgeKey?: BadgeKey;
	}> = [
		{ href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
		{ href: '/admin/projects', label: 'Projects', icon: FolderKanban },
		{ href: '/admin/blog', label: 'Blog', icon: FileText },
		{ href: '/admin/experiences', label: 'Experiences', icon: Briefcase },
		{ href: '/admin/skills', label: 'Skills', icon: Wrench },
		{ href: '/admin/messages', label: 'Messages', icon: Mail, badgeKey: 'unreadMessages' },
		{ href: '/admin/guestbook', label: 'Guestbook', icon: MessageSquare, badgeKey: 'pendingGuestbook' },
		{ href: '/admin/audit', label: 'Audit Log', icon: ScrollText },
		{ href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
		{ href: '/admin/settings', label: 'Settings', icon: Settings2 }
	];

	function isActive(item: { href: string; exact?: boolean }) {
		const path = page.url.pathname;
		if (item.exact) return path === item.href;
		return path === item.href || path.startsWith(item.href + '/');
	}

	function handleKey(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			paletteOpen = true;
		}
	}
</script>

<svelte:window on:keydown={handleKey} />

<DirtyPill />
<CommandPalette bind:open={paletteOpen} {nav} />

<div class="flex min-h-screen bg-background text-foreground">
	<!-- Sidebar -->
	<aside
		class={cn(
			'sticky top-0 flex h-screen flex-col border-r border-border bg-card/40 backdrop-blur-sm transition-[width] duration-300',
			collapsed ? 'w-[72px]' : 'w-64'
		)}
	>
		<div class="flex h-16 items-center justify-between gap-2 border-b border-border px-4">
			{#if !collapsed}
				<a href="/admin" class="text-sm font-semibold tracking-tight">akmmp / admin</a>
			{:else}
				<a
					href="/admin"
					class="grid h-8 w-8 place-items-center rounded-md bg-primary/15 text-xs font-bold text-primary"
					>A</a
				>
			{/if}
			<button
				type="button"
				aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				onclick={() => (collapsed = !collapsed)}
				class="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				{#if collapsed}
					<PanelLeftOpen class="h-4 w-4" />
				{:else}
					<PanelLeftClose class="h-4 w-4" />
				{/if}
			</button>
		</div>

		<nav class="relative flex-1 overflow-y-auto p-2">
			<ul class="flex flex-col gap-1">
				{#each nav as item (item.href)}
					{@const active = isActive(item)}
					<li>
						<a
							href={item.href}
							class={cn(
								'group relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm transition-colors',
								active
									? 'bg-primary/10 text-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
						>
							{#if active}
								<span
									class="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary transition-all duration-300"
								></span>
							{/if}
							<item.icon class={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
							{#if !collapsed}
								<span class="truncate">{item.label}</span>
								<!-- Badge with pulsing indicator -->
								{#if item.badgeKey && badgeCounts[item.badgeKey] > 0}
									<span class="ml-auto relative flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary transition-all animate-pulse">
										{badgeCounts[item.badgeKey]}
									</span>
								{/if}
							{:else if item.badgeKey && badgeCounts[item.badgeKey] > 0}
								<!-- Compact dot badge when sidebar is collapsed -->
								<span class="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background"></span>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="border-t border-border p-2">
			<button
				type="button"
				onclick={() => (paletteOpen = true)}
				class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<Search class="h-4 w-4 shrink-0" />
				{#if !collapsed}
					<span>Search</span>
					<kbd
						class="ml-auto rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]"
						>⌘K</kbd
					>
				{/if}
			</button>
		</div>

		<div class="flex flex-col gap-1 border-t border-border p-2">
			<button
				type="button"
				onclick={toggleMode}
				class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				aria-label="Toggle theme"
			>
				{#if mode.current === 'dark'}
					<Sun class="h-4 w-4 shrink-0" />
				{:else}
					<Moon class="h-4 w-4 shrink-0" />
				{/if}
				{#if !collapsed}
					<span>{mode.current === 'dark' ? 'Light' : 'Dark'} mode</span>
				{/if}
			</button>

			<form method="POST" action="/admin/logout" class="contents">
				<button
					type="submit"
					class="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
				>
					<LogOut class="h-4 w-4 shrink-0" />
					{#if !collapsed}
						<span>Sign out</span>
					{/if}
				</button>
			</form>

			<div class="mt-1 flex items-center gap-2 rounded-md px-3 py-2">
				<div
					class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-medium text-primary"
				>
					{(user.name ?? user.email).charAt(0).toUpperCase()}
				</div>
				{#if !collapsed}
					<div class="flex min-w-0 flex-col">
						<span class="truncate text-xs font-medium">{user.name ?? 'Admin'}</span>
						<span class="truncate text-[11px] text-muted-foreground">{user.email}</span>
					</div>
				{/if}
			</div>
		</div>
	</aside>

	<!-- Main -->
	<main class="min-w-0 flex-1">
		<header class="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
			<button
				type="button"
				onclick={() => (paletteOpen = true)}
				class="ml-auto flex w-72 items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent"
			>
				<Search class="h-4 w-4" />
				<span class="flex-1 text-left">Search admin…</span>
				<kbd class="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
			</button>
		</header>

		<div class="px-4 py-6 sm:px-6 sm:py-8">
			{@render children()}
		</div>
	</main>
</div>
