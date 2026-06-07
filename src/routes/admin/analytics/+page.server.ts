import type { PageServerLoad } from './$types';
import {
	getOverviewStats,
	getViewsOverTime,
	getTopPages,
	getTopReferrers,
	getGeoBreakdown,
	getDeviceBreakdown,
	getActiveNow,
	type DateRange
} from '$lib/server/analytics';

const VALID_RANGES: DateRange[] = ['1d', '7d', '30d', '90d', 'year', 'all'];

export const load: PageServerLoad = async ({ url }) => {
	const rawRange = url.searchParams.get('range') ?? '30d';
	const range: DateRange = VALID_RANGES.includes(rawRange as DateRange)
		? (rawRange as DateRange)
		: '30d';
	const from = url.searchParams.get('from') ?? undefined;
	const to = url.searchParams.get('to') ?? undefined;

	const [overview, viewsOverTime, topPages, topReferrers, geo, deviceData, activeNow] =
		await Promise.all([
			getOverviewStats(range, from, to),
			getViewsOverTime(range, from, to),
			getTopPages(range, 10, from, to),
			getTopReferrers(range, 10, from, to),
			getGeoBreakdown(range, from, to),
			getDeviceBreakdown(range, from, to),
			getActiveNow()
		]);

	return {
		range,
		from: from ?? null,
		to: to ?? null,
		overview,
		viewsOverTime,
		topPages,
		topReferrers,
		geo,
		devices: deviceData.devices,
		browsers: deviceData.browsers,
		activeNow
	};
};
