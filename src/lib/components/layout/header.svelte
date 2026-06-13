<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import {
		Search,
		Home,
		FolderKanban,
		BookOpen,
		MoreHorizontal,
		User,
		Mail,
		MessageSquare
	} from '@lucide/svelte';
	import LocaleSwitcher from './locale-switcher.svelte';
	import ThemeToggle from './theme-toggle.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime.js';
	import { page } from '$app/state';
	import { cn } from '$lib/utils/cn';

	const navs = [
		{ href: '/', key: 'home' },
		{ href: '/projects', key: 'projects' },
		{ href: '/blog', key: 'blog' },
		{ href: '/about', key: 'about-me' },
		{ href: '/contact', key: 'contacts' },
		{ href: '/guestbook', key: 'guestbook' }
	] as const;

	const labelMap = {
		home: m.home_nav_home,
		projects: m.home_nav_projects,
		blog: m.home_nav_blog,
		'about-me': m.home_nav_about,
		contacts: m.home_nav_contacts,
		guestbook: m.home_nav_guestbook
	} as const;

	let isMoreOpen = $state(false);
	let scrolled = $state(false);
	let listRef = $state<HTMLElement | null>(null);
	let hoveredIndex = $state<number | null>(null);
	let bubbleStyle = $state({ left: '0px', width: '0px', height: '0px', top: '0px', opacity: 0 });

	const path = $derived(page.url.pathname);
	const activeIndex = $derived(navs.findIndex((nav) => isActive(nav.href)));

	function toggleMoreMenu() {
		isMoreOpen = !isMoreOpen;
		if (browser) {
			document.documentElement.style.overflow = isMoreOpen ? 'hidden' : '';
		}
	}

	function closeMoreMenu() {
		if (isMoreOpen) {
			isMoreOpen = false;
			if (browser) document.documentElement.style.overflow = '';
		}
	}

	function isActive(href: string): boolean {
		const p: string = path;
		if (href === '/') return p === '/' || p === '/id';
		return p === href || p === `/id${href}`;
	}

	onMount(() => {
		if (!browser) return;
		const onScroll = () => {
			scrolled = window.scrollY > 40;
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			document.documentElement.style.overflow = '';
		};
	});

	// Reactive effect to update desktop sliding bubble position
	$effect(() => {
		const indexToUse = hoveredIndex !== null ? hoveredIndex : (activeIndex !== -1 ? activeIndex : null);
		if (listRef && indexToUse !== null && indexToUse !== -1) {
			const items = listRef.querySelectorAll('.nav-item');
			const item = items[indexToUse] as HTMLElement;
			if (item) {
				bubbleStyle = {
					left: `${item.offsetLeft}px`,
					width: `${item.offsetWidth}px`,
					height: `${item.offsetHeight}px`,
					top: `${item.offsetTop}px`,
					opacity: 1
				};
			}
		} else if (bubbleStyle.opacity !== 0) {
			bubbleStyle = { ...bubbleStyle, opacity: 0 };
		}
	});
</script>

<!-- BACKDROP FOR MOBILE DRAWERS -->
{#if isMoreOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[998] bg-background/60 backdrop-blur-sm transition-all duration-300 lg:hidden"
		onclick={closeMoreMenu}
	></div>
{/if}

<!-- 1. DESKTOP NAVIGATION (FLOATING TOP DOCK) -->
<header
	class={cn(
		'fixed top-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 rounded-full border shadow-lg backdrop-blur-xl transition-all duration-300 hidden lg:block',
		scrolled
			? 'border-border/60 bg-background/80 py-2.5 px-6 shadow-md'
			: 'border-border/20 bg-background/70 py-3.5 px-8'
	)}
>
	<div class="flex items-center justify-between">
		<!-- Brand Logo -->
		<a href={localizeHref('/')} class="group flex items-center gap-2" onclick={closeMoreMenu}>
			<span
				class="border-primary text-primary inline-flex h-6 w-6 items-center justify-center rounded-sm border text-xs font-bold transition-transform duration-200 group-hover:scale-110"
				>A</span
			>
			<span class="text-lg font-bold transition-colors duration-200 group-hover:text-primary"
				>Akmalmp</span
			>
		</a>

		<!-- Navigation links with sliding indicator bubble -->
		<nav>
			<div class="relative flex items-center">
				<ul
					bind:this={listRef}
					class="border-border/20 bg-muted/30 relative flex items-center gap-1 rounded-full border p-1 font-medium"
				>
					<!-- Active/Hover backdrop pill -->
					<div
						class="bg-primary/10 border-primary/20 absolute rounded-full border transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
						style="left: {bubbleStyle.left}; width: {bubbleStyle.width}; height: {bubbleStyle.height}; top: {bubbleStyle.top}; opacity: {bubbleStyle.opacity};"
					></div>

					{#each navs as nav, i (nav.key)}
						<li
							class="nav-item relative z-10 text-base"
							onmouseenter={() => (hoveredIndex = i)}
							onmouseleave={() => (hoveredIndex = null)}
						>
							<a
								href={localizeHref(nav.href)}
								class={cn(
									'block rounded-full px-4 py-1.5 transition-colors duration-200 hover:text-foreground',
									isActive(nav.href) ? 'text-primary font-semibold' : 'text-muted-foreground'
								)}
							>
								<span class="text-primary opacity-60">#</span>{labelMap[nav.key]()}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</nav>

		<!-- Desktop Action Group -->
		<div class="flex items-center gap-1.5">
			<a
				href={localizeHref('/search')}
				aria-label="Search"
				class="text-muted-foreground hover:text-foreground hover:bg-accent border-border/30 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-colors hover:border"
			>
				<Search size={16} />
			</a>
			<div class="border-border/30 mx-1.5 h-4 border-l"></div>
			<LocaleSwitcher class="hover:bg-accent rounded-full px-3 py-1.5 text-sm" />
			<div class="border-border/30 mx-1.5 h-4 border-l"></div>
			<ThemeToggle class="rounded-full hover:bg-accent" />
		</div>
	</div>
</header>

<!-- 2. MOBILE NAVIGATION BRANDING & QUICK ACTIONS (TOP LEFT/RIGHT) -->
<div
	class="pointer-events-none fixed inset-x-4 top-4 z-50 flex items-center justify-between lg:hidden"
>
	<!-- Floating Logo -->
	<a
		href={localizeHref('/')}
		class="bg-background/80 border-border/40 pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2 shadow-md backdrop-blur-md"
		onclick={closeMoreMenu}
	>
		<span
			class="border-primary text-primary inline-flex h-5 w-5 items-center justify-center rounded-sm border text-[10px] font-bold"
			>A</span
		>
		<span class="text-sm font-bold">Akmalmp</span>
	</a>

	<!-- Floating Quick Actions -->
	<div
		class="bg-background/80 border-border/40 pointer-events-auto flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-md backdrop-blur-md"
	>
		<a
			href={localizeHref('/search')}
			aria-label="Search"
			class="text-foreground hover:bg-accent inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors"
			onclick={closeMoreMenu}
		>
			<Search size={16} />
		</a>
		<ThemeToggle class="h-8 w-8 rounded-full" />
	</div>
</div>

<!-- 3. MOBILE FLOATING BOTTOM DOCK -->
<nav
	class="border-border/40 bg-background/80 fixed bottom-6 left-1/2 z-[1000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-full border px-4 py-2.5 shadow-lg backdrop-blur-md lg:hidden"
>
	<ul class="flex items-center justify-around w-full font-medium">
		<!-- Home -->
		<li class="flex flex-col items-center">
			<a
				href={localizeHref('/')}
				class={cn(
					'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors',
					isActive('/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
				onclick={closeMoreMenu}
			>
				<Home size={18} />
				<span class="text-[10px] font-semibold">{m.home_nav_home()}</span>
			</a>
		</li>

		<!-- Projects -->
		<li class="flex flex-col items-center">
			<a
				href={localizeHref('/projects')}
				class={cn(
					'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors',
					isActive('/projects') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
				onclick={closeMoreMenu}
			>
				<FolderKanban size={18} />
				<span class="text-[10px] font-semibold">{m.home_nav_projects()}</span>
			</a>
		</li>

		<!-- Blog -->
		<li class="flex flex-col items-center">
			<a
				href={localizeHref('/blog')}
				class={cn(
					'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors',
					isActive('/blog') ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
				onclick={closeMoreMenu}
			>
				<BookOpen size={18} />
				<span class="text-[10px] font-semibold">{m.home_nav_blog()}</span>
			</a>
		</li>

		<!-- More trigger -->
		<li class="flex flex-col items-center">
			<button
				type="button"
				onclick={toggleMoreMenu}
				class={cn(
					'flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 transition-colors cursor-pointer',
					isMoreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
				)}
			>
				<MoreHorizontal size={18} />
				<span class="text-[10px] font-semibold">More</span>
			</button>
		</li>
	</ul>
</nav>

<!-- 4. MOBILE SLIDE-UP DRAWER SHEET -->
<div
	class={cn(
		'bg-background/95 border-border/40 fixed inset-x-0 bottom-0 z-[1001] rounded-t-[2rem] border-t px-8 pt-6 pb-10 shadow-2xl backdrop-blur-lg transition-transform duration-300 ease-out lg:hidden',
		isMoreOpen ? 'translate-y-0' : 'translate-y-full'
	)}
>
	<!-- Drawer drag handle -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="bg-muted hover:bg-muted-foreground/35 mx-auto mb-6 h-1 w-12 cursor-pointer rounded-full transition-colors"
		onclick={closeMoreMenu}
	></div>

	<div class="flex flex-col gap-6">
		<h3 class="text-muted-foreground text-xs font-bold uppercase tracking-wider">Menu</h3>

		<ul class="flex flex-col gap-3.5">
			{#each navs.slice(3) as nav (nav.key)}
				<li>
					<a
						href={localizeHref(nav.href)}
						onclick={closeMoreMenu}
						class={cn(
							'flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-lg transition-colors',
							isActive(nav.href)
								? 'bg-primary/10 border-primary/20 text-primary font-semibold'
								: 'hover:bg-accent text-foreground'
						)}
					>
						{#if nav.key === 'about-me'}
							<User size={20} />
						{:else if nav.key === 'contacts'}
							<Mail size={20} />
						{:else if nav.key === 'guestbook'}
							<MessageSquare size={20} />
						{/if}
						{labelMap[nav.key]()}
					</a>
				</li>
			{/each}
		</ul>

		<div class="border-border/40 my-1 border-t"></div>

		<!-- Language Settings in Drawer -->
		<div class="flex items-center justify-between px-2">
			<span class="text-muted-foreground text-sm font-medium">Select Language</span>
			<LocaleSwitcher class="border-border/30 border rounded-xl px-4 py-2 hover:bg-accent" />
		</div>

		<div class="text-muted-foreground mt-4 text-center text-xs">
			akmalmp241@gmail.com
		</div>
	</div>
</div>

<style>
	:global(.nav-item a) {
		-webkit-tap-highlight-color: transparent;
	}
</style>
