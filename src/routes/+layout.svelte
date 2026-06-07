<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import { page } from '$app/state';
	import Header from '$lib/components/layout/header.svelte';
	import Footer from '$lib/components/layout/footer.svelte';
	import SocialRail from '$lib/components/layout/social-rail.svelte';
	import DotPattern from '$lib/components/fx/dot-pattern.svelte';
	import SplashScreen from '$lib/components/fx/splash-screen.svelte';

	let { data, children } = $props();

	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
	const site = $derived(data.site);
</script>

<svelte:head>
	<title>{site.siteName}</title>
	<meta name="description" content="Akmal Muhammad Pridianto — Software Engineer" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={site.siteName} />
	<meta property="og:image" content={site.ogImage} />
	<meta property="og:url" content={site.baseUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<link rel="alternate" type="application/rss+xml" href="/rss.xml" title="Akmal MP — Blog" />
</svelte:head>

{#if isAdmin}
	{@render children()}
{:else}
	<ModeWatcher />
	<SplashScreen />

	<a
		href="#main-content"
		class="bg-primary text-primary-foreground sr-only fixed top-3 left-3 z-[100] rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:outline-none"
	>
		Skip to content
	</a>

	<div class="relative min-h-screen overflow-hidden pb-24 lg:pb-0">
		<DotPattern
			parallax={0.15}
			class="fixed inset-0 -z-10 [mask-image:radial-gradient(800px_circle_at_center,white,transparent)]"
		/>

		<Header />
		<!-- <SocialRail /> -->

		<main id="main-content" class="m-auto mt-20 lg:mt-36 flex max-w-5xl flex-col gap-24">
			{@render children()}
		</main>

		<Footer />
	</div>
{/if}
