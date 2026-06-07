<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContributionWeek } from '$lib/server/github';

	interface Props {
		weeks: ContributionWeek[];
		totalContributions: number;
	}

	let { weeks, totalContributions }: Props = $props();

	// Show last 26 weeks on mobile, all 52 on desktop
	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 768px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	const displayedWeeks = $derived(isMobile ? weeks.slice(-26) : weeks);

	// Tooltip state
	let tooltip = $state<{ date: string; count: number; x: number; y: number } | null>(null);

	function showTooltip(e: MouseEvent, date: string, count: number) {
		tooltip = { date, count, x: (e.currentTarget as HTMLElement).offsetLeft, y: (e.currentTarget as HTMLElement).offsetTop };
	}

	function hideTooltip() {
		tooltip = null;
	}

	// Build color scale from the hex colors GitHub provides
	// Level 0 → transparent / dim, Level 4 → primary color
	function cellStyle(color: string, count: number): string {
		if (count === 0) return 'background:transparent;border:1px solid color-mix(in oklab,var(--color-border) 50%,transparent)';
		// Use GitHub's color but tint with primary for levels 1-4
		return `background:${color};opacity:0.9`;
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<span>{totalContributions.toLocaleString()} contributions in the last year</span>
		<span class="hidden sm:block">
			Less
			<span class="inline-flex gap-0.5 align-middle">
				{#each ['#1e1e2e', '#1b4332', '#2d6a4f', '#40916c', '#74c69d'] as c}
					<span class="inline-block h-3 w-3 rounded-sm" style="background:{c}"></span>
				{/each}
			</span>
			More
		</span>
	</div>

	<!-- Grid: columns = weeks, rows = days of week -->
	<div class="relative overflow-hidden" id="heatmap-grid">
		<div
			class="flex gap-[3px]"
			style="min-width:0"
		>
			{#each displayedWeeks as week, wi (wi)}
				<div class="flex flex-col gap-[3px]">
					{#each week.contributionDays as day, di (day.date)}
						<button
							type="button"
							class="h-3 w-3 rounded-sm transition-transform duration-75 hover:scale-125 focus:outline-none focus:ring-1 focus:ring-primary"
							style={cellStyle(day.color, day.contributionCount)}
							aria-label="{day.date}: {day.contributionCount} contribution{day.contributionCount !== 1 ? 's' : ''}"
							onmouseenter={(e) => showTooltip(e, day.date, day.contributionCount)}
							onmouseleave={hideTooltip}
						></button>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Tooltip -->
		{#if tooltip}
			<div
				class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-lg"
				style="left:{tooltip.x + 6}px;top:{tooltip.y - 4}px"
			>
				<strong>{tooltip.count}</strong> contribution{tooltip.count !== 1 ? 's' : ''}
				<br />
				<span class="text-muted-foreground">{tooltip.date}</span>
			</div>
		{/if}
	</div>

	<!-- Day labels -->
	<div class="flex justify-between text-[10px] text-muted-foreground">
		<span>Mon</span>
		<span>Wed</span>
		<span>Fri</span>
	</div>
</div>
