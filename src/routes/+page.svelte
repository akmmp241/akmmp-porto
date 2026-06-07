<script lang="ts">
	import { page } from '$app/state';
	import Hero from '$lib/components/sections/hero.svelte';
	import Quote from '$lib/components/sections/quote.svelte';
	import ProjectsGrid from '$lib/components/sections/projects-grid.svelte';
	import Skills from '$lib/components/sections/skills.svelte';
	import Experience from '$lib/components/sections/experience.svelte';
	import AboutMe from '$lib/components/sections/about-me.svelte';
	import Contacts from '$lib/components/sections/contacts.svelte';
	import GithubStats from '$lib/components/sections/github-stats.svelte';
	import SeoHead from '$lib/components/seo/seo-head.svelte';
	import { buildMeta, personJsonLd, websiteJsonLd } from '$lib/seo';
	import type { LangCode } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	const meta = $derived(
		buildMeta({
			url: page.url,
			lang: data.lang,
			site: data.site,
			title: `${data.site.owner} — Software Engineer`,
			description:
				data.lang === 'id'
					? `${data.site.owner} — Software Engineer fokus pada backend, infrastruktur, dan rekayasa perangkat lunak.`
					: `${data.site.owner} — Software Engineer focused on backend systems, infrastructure, and software craft.`,
			author: data.site.owner
		})
	);

	const socials = $derived((data.about?.socials ?? []).map((s) => s.url));
	const ld = $derived([personJsonLd(data.site, socials), websiteJsonLd(data.site)]);
</script>

<SeoHead {meta} jsonLd={ld} />

<Hero />
<Quote />
<ProjectsGrid projects={data.projects} lang={data.lang} />
<Skills lang={data.lang} skillGroups={data.skillGroups} />
<Experience experiences={data.experiences} lang={data.lang} />
<AboutMe />
{#if data.github}
	<GithubStats github={data.github} />
{/if}
<Contacts />

