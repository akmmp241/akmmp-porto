<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Card from '$lib/components/ui/card.svelte';
	import Badge from '$lib/components/ui/badge.svelte';
	import type { Experience } from '$lib/data/schemas';
	import { tr, type LangCode } from '$lib/i18n';

	let { experiences, lang }: { experiences: Experience[]; lang: LangCode } = $props();

	function formatRange(start: string, end?: string, current?: boolean): string {
		if (current) return `${start} - Present`;
		return end ? `${start} - ${end}` : start;
	}

	let timelineHost: HTMLDivElement;
	let progress = $state(0);

	onMount(() => {
		if (!browser || !timelineHost) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			progress = 1;
			return;
		}
		const onScroll = () => {
			const r = timelineHost.getBoundingClientRect();
			const vh = window.innerHeight;
			const total = r.height + vh;
			const traveled = Math.max(0, vh - r.top);
			progress = Math.max(0, Math.min(1, traveled / total));
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});

	let revealed = $state<Record<string, boolean>>({});

	function reveal(node: HTMLElement, id: string) {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (reduced) {
			revealed[id] = true;
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					revealed[id] = true;
					obs.disconnect();
				}
			},
			{ threshold: 0.2 }
		);
		obs.observe(node);
		return { destroy: () => obs.disconnect() };
	}
</script>

<div class="w-full" bind:this={timelineHost}>
	<!-- mobile -->
	<div class="block md:hidden">
		<div class="relative">
			<div class="bg-border absolute top-0 bottom-0 left-6 w-0.5"></div>
			<div
				class="bg-primary absolute top-0 left-6 w-0.5 origin-top"
				style="height: {progress * 100}%; transition: height 100ms linear;"
			></div>
			<div class="space-y-8">
				{#each experiences as exp (exp.id)}
					<div class="relative">
						<div
							class="border-background bg-primary absolute left-4 h-4 w-4 rounded-full border-4 shadow-sm"
						></div>
						<div
							class="ml-12 transition-all duration-500 ease-out"
							class:opacity-0={!revealed[exp.id]}
							class:translate-x-[-12px]={!revealed[exp.id]}
							use:reveal={exp.id}
						>
							<Card class="bg-transparent">
								<div class="space-y-3 p-6">
									<div>
										<h3 class="text-lg leading-tight font-bold">{exp.title}</h3>
										<div class="mt-1 flex flex-col gap-1">
											<p class="text-primary font-medium">{exp.company}</p>
											{#if exp.location}
												<p class="text-sm">{exp.location}</p>
											{/if}
										</div>
									</div>
									<div class="text-sm font-medium">
										{formatRange(exp.startDate, exp.endDate, exp.current)}
									</div>
									<p class="text-muted-foreground text-sm leading-relaxed">
										{tr(exp.description, lang)}
									</p>
									{#if exp.skills?.length}
										<div class="flex flex-wrap gap-2 pt-2">
											{#each exp.skills as skill (skill)}
												<Badge variant="secondary">{skill}</Badge>
											{/each}
										</div>
									{/if}
								</div>
							</Card>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- desktop -->
	<div class="hidden md:block">
		<div class="relative mx-auto max-w-6xl">
			<div class="bg-border absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-0.5"></div>
			<div
				class="bg-primary absolute top-0 left-1/2 w-0.5 origin-top -translate-x-0.5"
				style="height: {progress * 100}%; transition: height 100ms linear;"
			></div>
			<div class="space-y-12">
				{#each experiences as exp, i (exp.id)}
					<div class="relative">
						<div
							class="border-background bg-primary absolute left-1/2 z-10 h-4 w-4 -translate-x-1/2 rounded-full border-4 shadow-sm"
						></div>
						<div class={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
							<div
								class={`w-5/12 ${i % 2 === 0 ? 'pr-8' : 'pl-8'} transition-all duration-500 ease-out`}
								class:opacity-0={!revealed[exp.id]}
								class:translate-x-[-24px]={!revealed[exp.id] && i % 2 === 0}
								class:translate-x-[24px]={!revealed[exp.id] && i % 2 === 1}
								use:reveal={exp.id}
							>
								<Card
									class="hover:border-primary/30 bg-transparent transition-all duration-300 hover:shadow-lg"
								>
									<div class="space-y-4 p-8">
										<div>
											<h3 class="text-xl leading-tight font-bold text-balance">
												{exp.title}
											</h3>
											<div class="mt-2 flex flex-col gap-2">
												<p class="text-primary text-lg font-semibold">
													{exp.company}
												</p>
												{#if exp.location}
													<p class="text-sm">{exp.location}</p>
												{/if}
												<div
													class="border-muted-foreground inline-block w-fit rounded-md border px-3 py-1 text-sm font-medium"
												>
													{formatRange(exp.startDate, exp.endDate, exp.current)}
												</div>
											</div>
										</div>
										<p class="text-muted-foreground leading-relaxed text-pretty">
											{tr(exp.description, lang)}
										</p>
										{#if exp.skills?.length}
											<div class="flex flex-wrap gap-2 pt-2">
												{#each exp.skills as skill (skill)}
													<Badge variant="secondary">{skill}</Badge>
												{/each}
											</div>
										{/if}
									</div>
								</Card>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
