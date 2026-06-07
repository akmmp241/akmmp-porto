<script lang="ts">
	import { Star, GitFork, Users, BookOpen, AlertCircle } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import CountUp from '$lib/components/fx/count-up.svelte';
	import Reveal from '$lib/components/fx/reveal.svelte';
	import ContributionHeatmap from './contribution-heatmap.svelte';
	import type { GitHubStats } from '$lib/server/github';

	interface Props {
		github: GitHubStats;
	}

	let { github }: Props = $props();

	const { profile, repos, contributions, languages, stale } = $derived(github);

	// Top 6 repos by stars
	const topRepos = $derived(repos.slice(0, 6));

	const statCards = $derived([
		{ label: 'Total Stars', value: profile.totalStars, icon: Star },
		{ label: 'Repositories', value: profile.public_repos, icon: BookOpen },
		{ label: 'Followers', value: profile.followers, icon: Users },
		{ label: 'Contributions', value: contributions.totalContributions, icon: GitFork }
	]);
</script>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<div class="flex flex-1 items-center gap-4">
		<h2 class="flex items-center gap-3 text-3xl font-medium tracking-wide md:text-4xl">
			<span class="text-primary">#</span>
			<Github class="h-7 w-7" />
			GitHub Activity
		</h2>
		<div class="bg-primary h-0.5 w-1/5 md:w-2/5"></div>
	</div>

	{#if stale}
		<div class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-600 dark:text-amber-400">
			<AlertCircle class="h-4 w-4 shrink-0" />
			Showing cached data — GitHub API temporarily unavailable
		</div>
	{/if}

	<!-- Stats row -->
	<Reveal class="grid grid-cols-2 gap-4 sm:grid-cols-4">
		{#each statCards as card (card.label)}
			<a
				href={profile.html_url}
				target="_blank"
				rel="noopener noreferrer"
				class="group flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
			>
				<div class="flex items-center gap-2 text-muted-foreground">
					<card.icon class="h-4 w-4 transition-colors group-hover:text-primary" />
					<span class="text-xs">{card.label}</span>
				</div>
				<div class="text-2xl font-semibold tabular-nums">
					<CountUp to={card.value} duration={1200} />
				</div>
			</a>
		{/each}
	</Reveal>

	<!-- Contribution heatmap -->
	<Reveal>
		<div class="overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
			<h3 class="mb-4 text-sm font-semibold">Contribution Calendar</h3>
			<ContributionHeatmap
				weeks={contributions.weeks}
				totalContributions={contributions.totalContributions}
			/>
		</div>
	</Reveal>

	<!-- Languages + Top repos -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Language breakdown -->
		{#if languages.length > 0}
			<Reveal class="flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
				<h3 class="text-sm font-semibold">Languages</h3>
				<div class="flex flex-col gap-3">
					{#each languages as lang (lang.name)}
						<div class="flex flex-col gap-1.5">
							<div class="flex items-center justify-between text-xs">
								<div class="flex items-center gap-2">
									<span
										class="inline-block h-2.5 w-2.5 rounded-full"
										style="background:{lang.color ?? '#8b949e'}"
									></span>
									<span class="font-medium">{lang.name}</span>
								</div>
								<span class="tabular-nums text-muted-foreground">{lang.percentage}%</span>
							</div>
							<!-- Animated progress bar -->
							<div class="h-1.5 overflow-hidden rounded-full bg-muted">
								<div
									class="h-full rounded-full transition-all"
									style="width:{lang.percentage}%;background:{lang.color ?? '#8b949e'};transition:width 1s cubic-bezier(0.16,1,0.3,1) {languages.indexOf(lang) * 80}ms"
								></div>
							</div>
						</div>
					{/each}
				</div>
			</Reveal>
		{/if}

		<!-- Top repos -->
		{#if topRepos.length > 0}
			<Reveal direction="right" class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold">Top Repositories</h3>
				<div class="flex flex-col gap-2">
					{#each topRepos.slice(0, 4) as repo (repo.name)}
						<a
							href={repo.html_url}
							target="_blank"
							rel="noopener noreferrer"
							class="group flex flex-col gap-1 rounded-lg border border-border bg-card/40 px-4 py-3 transition-all hover:border-primary/40 hover:bg-card/80"
						>
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium group-hover:text-primary transition-colors">
									{repo.name}
								</span>
								<div class="flex items-center gap-3 text-xs text-muted-foreground">
									<span class="flex items-center gap-1">
										<Star class="h-3 w-3" />
										{repo.stargazers_count}
									</span>
									<span class="flex items-center gap-1">
										<GitFork class="h-3 w-3" />
										{repo.forks_count}
									</span>
								</div>
							</div>
							{#if repo.description}
								<p class="text-xs text-muted-foreground line-clamp-1">{repo.description}</p>
							{/if}
							{#if repo.language}
								<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
									<span
										class="inline-block h-2 w-2 rounded-full"
										style="background:{repo.languageColor ?? '#8b949e'}"
									></span>
									{repo.language}
								</div>
							{/if}
						</a>
					{/each}
				</div>
			</Reveal>
		{/if}
	</div>
</section>
