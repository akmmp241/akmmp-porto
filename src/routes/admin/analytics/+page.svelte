<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		TrendingUp,
		Users,
		FileText,
		ExternalLink,
		Download,
		Activity,
		Globe,
		Monitor,
		BarChart2,
		RefreshCw
	} from '@lucide/svelte';
	import CountUp from '$lib/components/fx/count-up.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// ── Date range controls ──────────────────────────────────────────────────
	const PRESETS = [
		{ label: 'Today', value: '1d' },
		{ label: '7 days', value: '7d' },
		{ label: '30 days', value: '30d' },
		{ label: '90 days', value: '90d' },
		{ label: 'Year', value: 'year' },
		{ label: 'All time', value: 'all' }
	] as const;

	let customFrom = $state(data.from ?? '');
	let customTo = $state(data.to ?? '');

	function setRange(r: string) {
		const u = new URL(page.url);
		u.searchParams.set('range', r);
		u.searchParams.delete('from');
		u.searchParams.delete('to');
		goto(u.toString(), { replaceState: true });
	}

	function applyCustomRange() {
		if (!customFrom || !customTo) return;
		const u = new URL(page.url);
		u.searchParams.set('from', customFrom);
		u.searchParams.set('to', customTo);
		u.searchParams.delete('range');
		goto(u.toString(), { replaceState: true });
	}

	async function exportCsv() {
		const params = new URLSearchParams();
		if (data.from) params.set('from', data.from);
		if (data.to) params.set('to', data.to);
		if (data.range) params.set('range', data.range);
		const res = await fetch(`/api/analytics/export?${params}`);
		if (!res.ok) return;
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `analytics-${data.range ?? 'custom'}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	}

	// ── Chart.js setup ────────────────────────────────────────────────────────
	let lineCanvas: HTMLCanvasElement;
	let barPagesCanvas: HTMLCanvasElement;
	let barRefsCanvas: HTMLCanvasElement;
	let pieDeviceCanvas: HTMLCanvasElement;
	let pieBrowserCanvas: HTMLCanvasElement;

	// Chart.js is loaded dynamically to keep SSR clean
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let Chart: any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let charts: any[] = [];

	const PRIMARY_COLOR = 'rgb(199, 120, 221)';
	const PRIMARY_ALPHA = 'rgba(199, 120, 221, 0.15)';
	const CHART_COLORS = [
		'#c778dd',
		'#7c8ee8',
		'#5dcfa8',
		'#f6b544',
		'#e87c8e',
		'#44c8e8',
		'#a8e87c',
		'#e8a844'
	];

	function destroyCharts() {
		charts.forEach((c) => c?.destroy());
		charts = [];
	}

	function initCharts() {
		destroyCharts();

		const isDark = document.documentElement.classList.contains('dark');
		const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
		const tickColor = isDark ? '#abb2bf' : '#666';

		Chart.defaults.font.family = "'Fira Code', monospace";

		// ── Views over time (line chart) ─────────────────────────────────────
		const labels = data.viewsOverTime.map((d) => d.date);
		const views = data.viewsOverTime.map((d) => d.views ?? 0);
		const uniqueViews = data.viewsOverTime.map((d) => d.uniqueViews ?? 0);

		charts.push(
			new Chart(lineCanvas, {
				type: 'line',
				data: {
					labels,
					datasets: [
						{
							label: 'Page Views',
							data: views,
							borderColor: PRIMARY_COLOR,
							backgroundColor: PRIMARY_ALPHA,
							fill: true,
							tension: 0.4,
							pointRadius: labels.length > 60 ? 0 : 3,
							pointHoverRadius: 5,
							borderWidth: 2
						},
						{
							label: 'Unique Visitors',
							data: uniqueViews,
							borderColor: CHART_COLORS[1],
							backgroundColor: 'rgba(124,142,232,0.1)',
							fill: true,
							tension: 0.4,
							pointRadius: labels.length > 60 ? 0 : 3,
							pointHoverRadius: 5,
							borderWidth: 2
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					interaction: { mode: 'index', intersect: false },
					plugins: {
						legend: { labels: { color: tickColor, boxWidth: 12 } },
						tooltip: {
							backgroundColor: isDark ? '#282c33' : '#fff',
							titleColor: isDark ? '#e6e6e6' : '#111',
							bodyColor: isDark ? '#abb2bf' : '#555',
							borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							borderWidth: 1,
							padding: 10
						}
					},
					scales: {
						x: {
							grid: { color: gridColor },
							ticks: { color: tickColor, maxTicksLimit: 12 }
						},
						y: {
							grid: { color: gridColor },
							ticks: { color: tickColor },
							beginAtZero: true
						}
					}
				}
			})
		);

		// ── Top pages (horizontal bar) ────────────────────────────────────────
		charts.push(
			new Chart(barPagesCanvas, {
				type: 'bar',
				data: {
					labels: data.topPages.map((p) => (p.path.length > 30 ? p.path.slice(0, 30) + '…' : p.path)),
					datasets: [
						{
							label: 'Views',
							data: data.topPages.map((p) => p.views ?? 0),
							backgroundColor: CHART_COLORS.map((c) => c + '99'),
							borderColor: CHART_COLORS,
							borderWidth: 1,
							borderRadius: 4
						}
					]
				},
				options: {
					indexAxis: 'y',
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							backgroundColor: isDark ? '#282c33' : '#fff',
							titleColor: isDark ? '#e6e6e6' : '#111',
							bodyColor: isDark ? '#abb2bf' : '#555',
							borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							borderWidth: 1
						}
					},
					scales: {
						x: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true },
						y: { grid: { display: false }, ticks: { color: tickColor } }
					}
				}
			})
		);

		// ── Top referrers (horizontal bar) ────────────────────────────────────
		charts.push(
			new Chart(barRefsCanvas, {
				type: 'bar',
				data: {
					labels: data.topReferrers.map((r) =>
						r.referrer.length > 30 ? r.referrer.slice(0, 30) + '…' : r.referrer
					),
					datasets: [
						{
							label: 'Visits',
							data: data.topReferrers.map((r) => r.count ?? 0),
							backgroundColor: CHART_COLORS.map((c) => c + '99'),
							borderColor: CHART_COLORS,
							borderWidth: 1,
							borderRadius: 4
						}
					]
				},
				options: {
					indexAxis: 'y',
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { display: false },
						tooltip: {
							backgroundColor: isDark ? '#282c33' : '#fff',
							titleColor: isDark ? '#e6e6e6' : '#111',
							bodyColor: isDark ? '#abb2bf' : '#555',
							borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							borderWidth: 1
						}
					},
					scales: {
						x: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true },
						y: { grid: { display: false }, ticks: { color: tickColor } }
					}
				}
			})
		);

		// ── Devices (doughnut) ────────────────────────────────────────────────
		charts.push(
			new Chart(pieDeviceCanvas, {
				type: 'doughnut',
				data: {
					labels: data.devices.map((d) => d.deviceType),
					datasets: [
						{
							data: data.devices.map((d) => d.count ?? 0),
							backgroundColor: CHART_COLORS,
							borderColor: isDark ? '#282c33' : '#fff',
							borderWidth: 2,
							hoverOffset: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12, padding: 12 } },
						tooltip: {
							backgroundColor: isDark ? '#282c33' : '#fff',
							titleColor: isDark ? '#e6e6e6' : '#111',
							bodyColor: isDark ? '#abb2bf' : '#555',
							borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							borderWidth: 1
						}
					}
				}
			})
		);

		// ── Browsers (doughnut) ───────────────────────────────────────────────
		charts.push(
			new Chart(pieBrowserCanvas, {
				type: 'doughnut',
				data: {
					labels: data.browsers.map((b) => b.browser),
					datasets: [
						{
							data: data.browsers.map((b) => b.count ?? 0),
							backgroundColor: CHART_COLORS.slice().reverse(),
							borderColor: isDark ? '#282c33' : '#fff',
							borderWidth: 2,
							hoverOffset: 6
						}
					]
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					plugins: {
						legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12, padding: 12 } },
						tooltip: {
							backgroundColor: isDark ? '#282c33' : '#fff',
							titleColor: isDark ? '#e6e6e6' : '#111',
							bodyColor: isDark ? '#abb2bf' : '#555',
							borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
							borderWidth: 1
						}
					}
				}
			})
		);
	}

	onMount(async () => {
		// Dynamically import Chart.js to avoid SSR issues
		const mod = await import('chart.js/auto');
		Chart = mod.default;
		initCharts();
		return () => destroyCharts();
	});

	// Re-init charts when data changes
	$effect(() => {
		if (!Chart) return;
		// Touch reactive data
		void data.viewsOverTime;
		void data.topPages;
		initCharts();
	});

	// Derived state for cards and geo stats to fix Svelte 5 @const placement rules
	const cards = $derived([
		{ label: 'Total Views', value: data.overview.totalViews, icon: TrendingUp, accent: 'text-primary' },
		{ label: 'Unique Visitors', value: data.overview.totalUnique, icon: Users, accent: 'text-sky-500' },
		{ label: 'Top Page', value: null, text: data.overview.topPage ?? '—', icon: FileText, accent: 'text-amber-500' },
		{ label: 'Top Referrer', value: null, text: data.overview.topReferrer ?? '—', icon: ExternalLink, accent: 'text-emerald-500' }
	]);

	const geoTotal = $derived(data.geo.reduce((s, r) => s + (r.count ?? 0), 0));
</script>

<svelte:head>
	<title>Analytics — Admin</title>
</svelte:head>

<!-- Header -->
<div class="mb-6 flex flex-col gap-1">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-semibold tracking-tight">Analytics</h1>
			<p class="text-sm text-muted-foreground">Self-hosted page view insights. No third-party trackers.</p>
		</div>
		<div class="flex items-center gap-3">
			<!-- Active now badge -->
			<div class="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-sm backdrop-blur-sm">
				<span class="relative flex h-2.5 w-2.5">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
				</span>
				<span class="font-medium text-emerald-600 dark:text-emerald-400">{data.activeNow}</span>
				<span class="text-muted-foreground">active now</span>
			</div>
			<button
				type="button"
				onclick={exportCsv}
				class="flex items-center gap-2 rounded-md border border-border bg-card/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
			>
				<Download class="h-4 w-4" />
				Export CSV
			</button>
		</div>
	</div>
</div>

<!-- Date range controls -->
<div class="mb-6 flex flex-wrap items-center gap-2">
	{#each PRESETS as preset (preset.value)}
		<button
			type="button"
			onclick={() => setRange(preset.value)}
			class="rounded-md px-3 py-1.5 text-sm font-medium transition-colors {data.range === preset.value && !data.from
				? 'bg-primary/15 text-primary'
				: 'text-muted-foreground hover:bg-accent hover:text-foreground'}"
		>
			{preset.label}
		</button>
	{/each}
	<div class="ml-2 flex items-center gap-2 border-l border-border pl-4">
		<input
			type="date"
			bind:value={customFrom}
			class="rounded-md border border-border bg-card/40 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
		/>
		<span class="text-xs text-muted-foreground">to</span>
		<input
			type="date"
			bind:value={customTo}
			class="rounded-md border border-border bg-card/40 px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
		/>
		<button
			type="button"
			onclick={applyCustomRange}
			class="flex items-center gap-1 rounded-md bg-primary/15 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/25 transition-colors"
		>
			<RefreshCw class="h-3.5 w-3.5" />
			Apply
		</button>
	</div>
</div>

<!-- Overview cards -->
<div class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
	{#each cards as card (card.label)}
		<div class="group relative overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
			<div class="flex items-start justify-between">
				<div class="min-w-0 flex-1">
					<p class="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
					<div class="mt-2 text-2xl font-semibold tabular-nums">
						{#if card.value !== null}
							<CountUp to={card.value ?? 0} />
						{:else}
							<span class="truncate text-base font-medium">{card.text}</span>
						{/if}
					</div>
				</div>
				<div class="ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 transition-transform group-hover:rotate-6">
					<card.icon class="h-5 w-5 {card.accent}" />
				</div>
			</div>
		</div>
	{/each}
</div>

<!-- Views over time chart -->
<div class="mb-8 overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
	<div class="mb-4 flex items-center gap-2">
		<Activity class="h-4 w-4 text-primary" />
		<h2 class="text-sm font-semibold">Views Over Time</h2>
	</div>
	{#if data.viewsOverTime.length === 0}
		<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">
			No data yet for this range. Views appear after the daily aggregation runs.
		</div>
	{:else}
		<div class="h-64">
			<canvas bind:this={lineCanvas}></canvas>
		</div>
	{/if}
</div>

<!-- Top pages + Referrers side by side -->
<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
	<div class="overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center gap-2">
			<FileText class="h-4 w-4 text-amber-500" />
			<h2 class="text-sm font-semibold">Top Pages</h2>
		</div>
		{#if data.topPages.length === 0}
			<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">No page data yet.</div>
		{:else}
			<div class="h-64">
				<canvas bind:this={barPagesCanvas}></canvas>
			</div>
		{/if}
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center gap-2">
			<ExternalLink class="h-4 w-4 text-emerald-500" />
			<h2 class="text-sm font-semibold">Top Referrers</h2>
		</div>
		{#if data.topReferrers.length === 0}
			<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">No referrer data yet.</div>
		{:else}
			<div class="h-64">
				<canvas bind:this={barRefsCanvas}></canvas>
			</div>
		{/if}
	</div>
</div>

<!-- Devices + Browsers side by side -->
<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
	<div class="overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center gap-2">
			<Monitor class="h-4 w-4 text-violet-500" />
			<h2 class="text-sm font-semibold">Devices</h2>
		</div>
		{#if data.devices.length === 0}
			<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">No device data yet.</div>
		{:else}
			<div class="h-56">
				<canvas bind:this={pieDeviceCanvas}></canvas>
			</div>
		{/if}
	</div>

	<div class="overflow-hidden rounded-xl border border-border bg-card/40 p-5 backdrop-blur-sm">
		<div class="mb-4 flex items-center gap-2">
			<BarChart2 class="h-4 w-4 text-sky-500" />
			<h2 class="text-sm font-semibold">Browsers</h2>
		</div>
		{#if data.browsers.length === 0}
			<div class="flex h-48 items-center justify-center text-sm text-muted-foreground">No browser data yet.</div>
		{:else}
			<div class="h-56">
				<canvas bind:this={pieBrowserCanvas}></canvas>
			</div>
		{/if}
	</div>
</div>

<!-- Geo breakdown table -->
{#if data.geo.length > 0}
	<div class="mb-8 overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
		<div class="flex items-center gap-2 border-b border-border px-5 py-4">
			<Globe class="h-4 w-4 text-rose-500" />
			<h2 class="text-sm font-semibold">Countries</h2>
			<span class="ml-auto text-xs text-muted-foreground">IP-to-country not yet wired</span>
		</div>
		<table class="w-full text-sm">
			<thead class="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
				<tr>
					<th class="px-5 py-3 text-left font-medium">Country</th>
					<th class="px-5 py-3 text-right font-medium">Visits</th>
					<th class="px-5 py-3 text-right font-medium">Share</th>
				</tr>
			</thead>
			<tbody>
				{#each data.geo as row (row.country)}
					<tr class="border-t border-border transition-colors hover:bg-muted/30">
						<td class="px-5 py-3">{row.country}</td>
						<td class="px-5 py-3 text-right tabular-nums">{row.count}</td>
						<td class="px-5 py-3 text-right tabular-nums text-muted-foreground">
							{geoTotal > 0 ? Math.round(((row.count ?? 0) / geoTotal) * 100) : 0}%
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<!-- Raw page views note -->
<div class="rounded-xl border border-border bg-card/30 p-4 text-sm text-muted-foreground">
	<strong class="text-foreground">ℹ️ How charts are populated:</strong>
	Charts show pre-aggregated data from <code class="text-primary">daily_stats</code>.
	Run the aggregation endpoint <code class="text-primary">POST /api/analytics/aggregate</code> daily (e.g. via cron) to populate data.
	Real-time "active now" reads directly from raw <code class="text-primary">page_views</code>.
</div>
