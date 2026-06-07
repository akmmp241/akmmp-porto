<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import InteractiveHoverButton from '$lib/components/fx/interactive-hover-button.svelte';
	import ShinyButton from '$lib/components/fx/shiny-button.svelte';
	import Link from '$lib/components/ui/link.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import { localizeHref } from '$lib/paraglide/runtime.js';
</script>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.about_title()}</SectionHeading>
	<div class="flex h-fit flex-col gap-12 lg:flex-row lg:justify-between lg:gap-0">
		<Reveal class="text-muted-foreground flex-1">
			<p class="text-pretty">{m.about_description_1()}</p>
			<br />
			<p class="text-pretty">{m.about_description_2()}</p>
			<br />
			<p class="text-pretty">{m.about_description_3()}</p>
		</Reveal>
		<Reveal
			direction="right"
			class="flex flex-1 justify-center lg:justify-end items-center"
		>
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
	<div>
		<Link href={localizeHref('/about')}>
			<InteractiveHoverButton class="hidden w-fit md:block">
				{m.about_view_all()}
			</InteractiveHoverButton>
			<ShinyButton class="w-fit md:hidden">
				{m.about_view_all()} =&gt;
			</ShinyButton>
		</Link>
	</div>
</section>
