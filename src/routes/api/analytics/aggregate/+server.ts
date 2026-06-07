import type { RequestHandler } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { aggregateDailyStats } from '$lib/server/analytics';

/**
 * POST /api/analytics/aggregate
 * Aggregates raw page_views for a given date into summary tables.
 * Auth-protected — only callable by authenticated admin sessions.
 *
 * Body: { date?: string } — defaults to yesterday (UTC)
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	// Authorization — must be a logged-in admin
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	let targetDate: string;
	try {
		const body = (await request.json().catch(() => ({}))) as { date?: string };
		if (body.date && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
			targetDate = body.date;
		} else {
			// Default: yesterday UTC
			const yesterday = new Date(Date.now() - 86400_000);
			targetDate = yesterday.toISOString().slice(0, 10);
		}
	} catch {
		throw error(400, 'Invalid request body');
	}

	const result = await aggregateDailyStats(targetDate);

	return json({
		ok: true,
		date: targetDate,
		...result
	});
};
