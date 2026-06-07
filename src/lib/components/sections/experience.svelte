<script lang="ts">
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import ExperienceList from './experience-list.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { Experience } from '$lib/data/schemas';
	import type { LangCode } from '$lib/i18n';

	let { experiences, lang }: { experiences: Experience[]; lang: LangCode } = $props();
</script>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.experience_title()}</SectionHeading>
	<ExperienceList {experiences} {lang} />
</section>
