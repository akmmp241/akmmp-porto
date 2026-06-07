<script lang="ts">
	import Hero from '$lib/components/sections/hero.svelte';
	import Quote from '$lib/components/sections/quote.svelte';
	import ProjectsGrid from '$lib/components/sections/projects-grid.svelte';
	import Skills from '$lib/components/sections/skills.svelte';
	import Experience from '$lib/components/sections/experience.svelte';
	import AboutMe from '$lib/components/sections/about-me.svelte';
	import Contacts from '$lib/components/sections/contacts.svelte';
	import GithubStats from '$lib/components/sections/github-stats.svelte';
	import type { LangCode } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();
</script>

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

