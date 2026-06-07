<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { page } from '$app/state';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import ExperienceList from '$lib/components/sections/experience-list.svelte';
	import InteractiveHoverButton from '$lib/components/fx/interactive-hover-button.svelte';
	import ShinyButton from '$lib/components/fx/shiny-button.svelte';
	import Link from '$lib/components/ui/link.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import SeoHead from '$lib/components/seo/seo-head.svelte';
	import { buildMeta } from '$lib/seo';
	import type { LangCode } from '$lib/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData & { lang: LangCode } } = $props();

	const meta = $derived(
		buildMeta({
			url: page.url,
			lang: data.lang,
			site: page.data.site,
			title: `About · ${page.data.site.owner}`,
			description:
				data.lang === 'id'
					? `Tentang ${page.data.site.owner} — Software Engineer fokus backend, infrastruktur, dan rekayasa perangkat lunak.`
					: `About ${page.data.site.owner} — Software Engineer focused on backend systems, infrastructure, and software craft.`,
			type: 'profile',
			author: page.data.site.owner
		})
	);
</script>

<SeoHead {meta} />

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.about_title()}</SectionHeading>

	<div class="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
		<Reveal class="text-muted-foreground flex-1 space-y-4">
			<p class="text-foreground text-2xl font-semibold">{m.about_description_1()}</p>
			<p class="text-pretty">{m.about_long_1()}</p>
			<p class="text-pretty">{m.about_long_2()}</p>
			<p class="text-pretty">{m.about_long_3()}</p>
			<div class="pt-4">
				<Link href="/resume.pdf" external>
					<InteractiveHoverButton class="hidden w-fit md:block">
						{m.about_resume()}
					</InteractiveHoverButton>
					<ShinyButton class="w-fit md:hidden">
						{m.about_resume()} =&gt;
					</ShinyButton>
				</Link>
			</div>
		</Reveal>
		<Reveal direction="right" class="flex flex-1 justify-center lg:justify-end items-center">
			<div class="relative overflow-hidden rounded-3xl border border-border/30 bg-card/15 p-3 shadow-2xl backdrop-blur-sm max-w-xs md:max-w-sm">
				<img
					src="/akm-1.png"
					alt="Akmal"
					width="320"
					height="320"
					class="h-auto w-full object-cover rounded-2xl"
				/>
			</div>
		</Reveal>
	</div>
</section>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.experience_title()}</SectionHeading>
	<ExperienceList experiences={data.experiences} lang={data.lang} />
</section>
