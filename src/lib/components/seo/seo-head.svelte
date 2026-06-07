<script lang="ts">
	import type { BuiltMeta } from '$lib/seo';

	let { meta, jsonLd = [] }: { meta: BuiltMeta; jsonLd?: object[] } = $props();
</script>

<svelte:head>
	<title>{meta.title}</title>
	<meta name="description" content={meta.description} />
	<link rel="canonical" href={meta.canonical} />
	{#if meta.noindex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
	{/if}
	{#if meta.author}
		<meta name="author" content={meta.author} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content={meta.ogType} />
	<meta property="og:site_name" content={meta.siteName} />
	<meta property="og:locale" content={meta.ogLocale} />
	<meta property="og:title" content={meta.title} />
	<meta property="og:description" content={meta.description} />
	<meta property="og:url" content={meta.canonical} />
	<meta property="og:image" content={meta.ogImage} />
	<meta property="og:image:alt" content={meta.title} />

	{#if meta.ogType === 'article'}
		{#if meta.publishedTime}
			<meta property="article:published_time" content={meta.publishedTime} />
		{/if}
		{#if meta.modifiedTime}
			<meta property="article:modified_time" content={meta.modifiedTime} />
		{/if}
		{#if meta.author}
			<meta property="article:author" content={meta.author} />
		{/if}
		{#if meta.tags}
			{#each meta.tags as tag (tag)}
				<meta property="article:tag" content={tag} />
			{/each}
		{/if}
	{/if}

	<!-- Twitter -->
	<meta name="twitter:card" content={meta.twitterCard} />
	<meta name="twitter:title" content={meta.title} />
	<meta name="twitter:description" content={meta.description} />
	<meta name="twitter:image" content={meta.ogImage} />
	<meta name="twitter:image:alt" content={meta.title} />

	<!-- hreflang alternates -->
	{#each meta.alternates as alt (alt.hreflang)}
		<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
	{/each}

	<!-- JSON-LD -->
	{#each jsonLd as data, i (i)}
		{@html `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}<\/script>`}
	{/each}
</svelte:head>
