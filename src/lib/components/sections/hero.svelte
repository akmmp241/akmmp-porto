<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Link from '$lib/components/ui/link.svelte';
	import Highlighter from '$lib/components/fx/highlighter.svelte';
	import InteractiveHoverButton from '$lib/components/fx/interactive-hover-button.svelte';
	import ShinyButton from '$lib/components/fx/shiny-button.svelte';
	import Magnetic from '$lib/components/fx/magnetic.svelte';
	import Ripple from '$lib/components/fx/ripple.svelte';
	import TextScrambler from '$lib/components/fx/text-scrambler.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime.js';

	const lang = $derived(getLocale());

	let avatarHost: HTMLDivElement;
	let tx = $state(0);
	let ty = $state(0);

	onMount(() => {
		if (!browser) return;
		const isTouch = window.matchMedia('(pointer: coarse)').matches;
		if (isTouch) return;
		const onMove = (e: PointerEvent) => {
			const r = avatarHost.getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;
			const max = 8;
			tx = Math.max(-max, Math.min(max, ((e.clientX - cx) / r.width) * max * 2));
			ty = Math.max(-max, Math.min(max, ((e.clientY - cy) / r.height) * max * 2));
		};
		const onLeave = () => {
			tx = 0;
			ty = 0;
		};
		window.addEventListener('pointermove', onMove);
		document.addEventListener('mouseleave', onLeave);
		return () => {
			window.removeEventListener('pointermove', onMove);
			document.removeEventListener('mouseleave', onLeave);
		};
	});
</script>

<section class="flex flex-col items-center justify-center gap-12 px-6 md:flex-row lg:px-0">
	<div class="flex flex-1 flex-col gap-8">
		<h1 class="text-3xl md:text-5xl md:leading-[1.25] leading-[1.4] font-extrabold tracking-tight">
			<TextScrambler text={m.hero_tagline_1()} duration={400} />
			<br />
			<Highlighter action="underline" color="#C778DD">
				<span class={lang === 'id' ? 'italic' : ''}>{m.hero_role_1()}</span>
			</Highlighter>
			<br />
			{m.hero_tagline_2()}
			<br />
			<Highlighter action="box" color="#C778DD">
				<span class={lang === 'id' ? 'italic' : ''}>{m.hero_role_2()}</span>
			</Highlighter>
		</h1>
		<p class="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
			{m.hero_description_1()}
			<br class="lg:hidden" />
			{m.hero_description_2()}
		</p>
		<div class="pt-2">
			<Link href={localizeHref('/contact')}>
				<div class="hidden md:block">
					<Magnetic max={10} strength={0.18}>
						<Ripple class="rounded-full">
							<InteractiveHoverButton class="w-fit px-6 py-3">
								{m.hero_contact_me()}
							</InteractiveHoverButton>
						</Ripple>
					</Magnetic>
				</div>
				<ShinyButton class="w-fit md:hidden">
					{m.hero_contact_me()} =&gt;
				</ShinyButton>
			</Link>
		</div>
	</div>

	<div class="relative flex flex-col items-center">
		<!-- Avatar Container with glassmorphism and ambient glow -->
		<div 
			bind:this={avatarHost}
			class="relative overflow-hidden rounded-3xl border border-border/30 bg-card/25 p-4 shadow-2xl backdrop-blur-sm group transition-all duration-300 hover:border-primary/30"
		>
			<!-- Ambient glowing backdrop -->
			<div
				class="bg-primary/20 absolute -inset-10 -z-20 rounded-full blur-3xl opacity-70 transition-transform duration-500"
				style="transform: translate({tx * -1.5}px, {ty * -1.5}px);"
			></div>
			
			<img
				src="/akm-2.png"
				alt="Akmal"
				width="320"
				height="320"
				class="h-auto w-72 md:w-80 object-cover rounded-2xl will-change-transform transition-all duration-300 hover:scale-[1.02]"
				style="transform: translate({tx}px, {ty}px); transition: transform 120ms var(--ease-spring);"
				loading="eager"
			/>
		</div>

		<!-- Floating Opportunity Badge -->
		<div
			class="mt-6 flex items-center justify-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-lg shadow-primary/5 backdrop-blur-md transition-colors duration-300 hover:border-primary/40 cursor-default"
		>
			<span class="relative flex h-2.5 w-2.5">
				<span
					class="bg-primary absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping"
				></span>
				<span class="bg-primary relative inline-flex h-2.5 w-2.5 rounded-full"></span>
			</span>
			<p class="text-xs font-semibold text-primary">{m.hero_opportunities()}</p>
		</div>
	</div>
</section>
