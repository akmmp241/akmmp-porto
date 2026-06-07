<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import IconCloud from '$lib/components/fx/icon-cloud.svelte';
	import DotPattern from '$lib/components/fx/dot-pattern.svelte';
	import { iconCloudSlugs, iconCloudExternal } from '$lib/data/skills';
	import { tr, type LangCode } from '$lib/i18n';
	import type { SkillGroup } from '$lib/data/schemas';
	import Reveal from '$lib/components/fx/reveal.svelte';

	let { lang, skillGroups }: { lang: LangCode; skillGroups: SkillGroup[] } = $props();

	const images = [
		...iconCloudSlugs.map((s) => `https://cdn.simpleicons.org/${s}/${s}`),
		...iconCloudExternal
	];
</script>

<section class="relative flex flex-col gap-12 px-6 lg:p-0">
	<DotPattern
		glow={true}
		class="[mask-image:radial-gradient(400px_circle_at_center,white,transparent)]"
	/>

	<SectionHeading>{m.skills_title()}</SectionHeading>

	<div class="flex flex-col items-center md:flex-row">
		<div class="relative flex shrink-0 items-center justify-center" style="width:400px;height:400px;">
			<IconCloud {images} />
		</div>
		<div class="grid flex-1 grid-cols-1 sm:grid-cols-2 gap-4 lg:flex lg:h-fit lg:flex-wrap lg:justify-end">
			{#each skillGroups as group, i (i)}
				<Reveal delay={i * 50}>
					<div
						class="hover:border-primary/40 border border-border/60 sm:border-border/30 bg-card/10 hover:bg-card/20 flex min-w-44 flex-col rounded-2xl p-4 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 lg:h-fit lg:w-fit lg:max-w-xs"
					>
						<h2 class="border-b border-border/20 pb-2 text-base font-bold text-foreground/90 tracking-wide">{tr(group.title, lang)}</h2>
						<div class="flex flex-wrap gap-1.5 mt-3">
							{#each group.items as item (item)}
								<span class="text-xs font-semibold bg-secondary/50 text-foreground/85 border border-border/25 rounded-lg px-2 py-0.5 transition-all duration-200 hover:text-primary hover:bg-primary/10 hover:border-primary/25 cursor-default">
									{item}
								</span>
							{/each}
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
