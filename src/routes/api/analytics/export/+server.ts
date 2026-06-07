import type { RequestHandler } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { exportCsv, type DateRange } from '$lib/server/analytics';

const VALID_RANGES: DateRange[] = ['1d', '7d', '30d', '90d', 'year', 'all'];

/**
 * GET /api/analytics/export
 * Returns a CSV download of daily_stats for the selected range.
 * Auth-protected — admin only.
 *
 * Query params:
 *  - range: DateRange (default: 30d)
 *  - from: YYYY-MM-DD (optional, overrides range)
 *  - to:   YYYY-MM-DD (optional)
 */
export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const rawRange = url.searchParams.get('range') ?? '30d';
	const range: DateRange = VALID_RANGES.includes(rawRange as DateRange)
		? (rawRange as DateRange)
		: '30d';
	const from = url.searchParams.get('from') ?? undefined;
	const to = url.searchParams.get('to') ?? undefined;

	const csv = await exportCsv(range, from, to);
	const filename = `analytics-${from ?? range}-${to ?? ''}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'X-Content-Type-Options': 'nosniff',
			'Cache-Control': 'no-store'
		}
	});
};
