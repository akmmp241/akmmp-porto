/**
 * analytics.ts — Self-hosted page view analytics.
 *
 * Privacy guarantees:
 *  - IP addresses are NEVER stored.
 *  - session_id is SHA-256(IP + UA + YYYY-MM-DD) — one-way, resets daily.
 *  - No cookies used.
 *  - No cross-session tracking.
 */
import { db } from './db';
import {
	pageViews,
	dailyStats,
	referrerStats,
	geoStats,
	deviceStats
} from './db/schema';
import { sql, gte, and, desc, sum, count } from 'drizzle-orm';

// ───── UA Parsing ─────────────────────────────────────────────────────────────

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface ParsedUA {
	device: DeviceType;
	browser: string;
	os: string;
}

/** Lightweight UA parser — no external deps, covers 95%+ of real traffic. */
export function parseUserAgent(ua: string): ParsedUA {
	// Device
	let device: DeviceType = 'desktop';
	if (/ipad|tablet|kindle|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
		device = 'tablet';
	} else if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
		device = 'mobile';
	}

	// Browser
	let browser = 'Other';
	if (/edg\//i.test(ua)) browser = 'Edge';
	else if (/opr\//i.test(ua)) browser = 'Opera';
	else if (/chrome|chromium/i.test(ua) && !/edg|opr/i.test(ua)) browser = 'Chrome';
	else if (/firefox/i.test(ua)) browser = 'Firefox';
	else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
	else if (/msie|trident/i.test(ua)) browser = 'IE';

	// OS
	let os = 'Other';
	if (/windows/i.test(ua)) os = 'Windows';
	else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
	else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
	else if (/android/i.test(ua)) os = 'Android';
	else if (/linux/i.test(ua)) os = 'Linux';

	return { device, browser, os };
}

/** Common bot/crawler user-agent patterns to skip tracking. */
const BOT_PATTERN =
	/bot|crawl|slurp|spider|mediapartners|googlebot|bingbot|yandex|baidu|duckduckbot|facebot|ia_archiver|wget|curl|python-requests|go-http-client|okhttp|axios/i;

export function isBot(ua: string): boolean {
	return BOT_PATTERN.test(ua);
}

// ───── Session Hashing ────────────────────────────────────────────────────────

/**
 * Generate an anonymous, non-reversible session hash.
 * SHA-256(IP + UA + YYYY-MM-DD) — resets daily, not linkable across days.
 * IP is never stored — only used as hash input.
 */
export async function generateSessionHash(ip: string, ua: string): Promise<string> {
	const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	const raw = `${ip}|${ua}|${date}`;
	const bytes = new TextEncoder().encode(raw);
	const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ───── Tracking ───────────────────────────────────────────────────────────────

export interface TrackParams {
	path: string;
	referrer: string | null;
	userAgent: string;
	ip: string;
}

/**
 * Record a page view. Fire-and-forget — caller should not await.
 * Skips bots. No PII stored.
 */
export async function trackPageView(params: TrackParams): Promise<void> {
	try {
		if (isBot(params.userAgent)) return;

		const { device, browser, os } = parseUserAgent(params.userAgent);
		const sessionId = await generateSessionHash(params.ip, params.userAgent);

		await db.insert(pageViews).values({
			path: params.path,
			referrer: params.referrer || null,
			userAgent: params.userAgent,
			country: null, // TODO(security): wire in IP-to-country lookup (ip2location-lite)
			deviceType: device,
			browser,
			os,
			sessionId
		});
	} catch (err) {
		// Non-blocking — analytics failures must never break page loads
		console.error('[analytics] trackPageView error:', err);
	}
}

// ───── Aggregation ────────────────────────────────────────────────────────────

/**
 * Aggregate raw page_views for a given UTC date into summary tables.
 * Should be called once per day (e.g. via cron at midnight UTC).
 * Upserts rows so re-runs are idempotent.
 */
export async function aggregateDailyStats(targetDate: string): Promise<{ rows: number }> {
	const dayStart = `${targetDate}T00:00:00Z`;
	const dayEnd = `${targetDate}T23:59:59Z`;

	// Daily page views per path
	await db.execute(sql`
		INSERT INTO daily_stats (date, path, views, unique_views)
		SELECT
			${targetDate}::date,
			path,
			COUNT(*) as views,
			COUNT(DISTINCT session_id) as unique_views
		FROM page_views
		WHERE created_at >= ${dayStart}::timestamptz
		  AND created_at <= ${dayEnd}::timestamptz
		GROUP BY path
		ON CONFLICT (date, path) DO UPDATE
			SET views = EXCLUDED.views,
				unique_views = EXCLUDED.unique_views
	`);

	// Referrer stats
	await db.execute(sql`
		INSERT INTO referrer_stats (date, referrer, count)
		SELECT
			${targetDate}::date,
			COALESCE(referrer, 'direct') as referrer,
			COUNT(*) as count
		FROM page_views
		WHERE created_at >= ${dayStart}::timestamptz
		  AND created_at <= ${dayEnd}::timestamptz
		GROUP BY referrer
		ON CONFLICT (date, referrer) DO UPDATE
			SET count = EXCLUDED.count
	`);

	// Geo stats (only rows with non-null country)
	await db.execute(sql`
		INSERT INTO geo_stats (date, country, count)
		SELECT
			${targetDate}::date,
			country,
			COUNT(*) as count
		FROM page_views
		WHERE created_at >= ${dayStart}::timestamptz
		  AND created_at <= ${dayEnd}::timestamptz
		  AND country IS NOT NULL
		GROUP BY country
		ON CONFLICT (date, country) DO UPDATE
			SET count = EXCLUDED.count
	`);

	// Device stats
	await db.execute(sql`
		INSERT INTO device_stats (date, device_type, browser, count)
		SELECT
			${targetDate}::date,
			COALESCE(device_type, 'desktop') as device_type,
			COALESCE(browser, 'Other') as browser,
			COUNT(*) as count
		FROM page_views
		WHERE created_at >= ${dayStart}::timestamptz
		  AND created_at <= ${dayEnd}::timestamptz
		GROUP BY device_type, browser
		ON CONFLICT (date, device_type, browser) DO UPDATE
			SET count = EXCLUDED.count
	`);

	return { rows: 0 };
}


// ───── Dashboard Queries ──────────────────────────────────────────────────────

export type DateRange = '1d' | '7d' | '30d' | '90d' | 'year' | 'all';

function getRangeStart(range: DateRange): Date | null {
	const now = new Date();
	switch (range) {
		case '1d':
			return new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
		case '7d':
			return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		case '30d':
			return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
		case '90d':
			return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
		case 'year':
			return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
		case 'all':
			return null;
	}
}

/** Overview stat cards. */
export async function getOverviewStats(range: DateRange, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const dateFilter = start
		? and(
				gte(dailyStats.date, start.toISOString().slice(0, 10)),
				sql`${dailyStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	const [totals] = await db
		.select({
			totalViews: sum(dailyStats.views).mapWith(Number),
			totalUnique: sum(dailyStats.uniqueViews).mapWith(Number)
		})
		.from(dailyStats)
		.where(dateFilter);

	const topPages = await db
		.select({
			path: dailyStats.path,
			views: sum(dailyStats.views).mapWith(Number)
		})
		.from(dailyStats)
		.where(dateFilter)
		.groupBy(dailyStats.path)
		.orderBy(desc(sum(dailyStats.views)))
		.limit(1);

	const topRefs = await db
		.select({
			referrer: referrerStats.referrer,
			count: sum(referrerStats.count).mapWith(Number)
		})
		.from(referrerStats)
		.where(
			start
				? and(
						gte(referrerStats.date, start.toISOString().slice(0, 10)),
						sql`${referrerStats.date} <= ${end.toISOString().slice(0, 10)}::date`
					)
				: undefined
		)
		.groupBy(referrerStats.referrer)
		.orderBy(desc(sum(referrerStats.count)))
		.limit(1);

	return {
		totalViews: totals?.totalViews ?? 0,
		totalUnique: totals?.totalUnique ?? 0,
		topPage: topPages[0]?.path ?? null,
		topReferrer: topRefs[0]?.referrer ?? null
	};
}

/** Time-series data for line chart. */
export async function getViewsOverTime(range: DateRange, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const dateFilter = start
		? and(
				gte(dailyStats.date, start.toISOString().slice(0, 10)),
				sql`${dailyStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	return db
		.select({
			date: dailyStats.date,
			views: sum(dailyStats.views).mapWith(Number),
			uniqueViews: sum(dailyStats.uniqueViews).mapWith(Number)
		})
		.from(dailyStats)
		.where(dateFilter)
		.groupBy(dailyStats.date)
		.orderBy(dailyStats.date);
}

/** Top pages by total views. */
export async function getTopPages(range: DateRange, limit = 10, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const dateFilter = start
		? and(
				gte(dailyStats.date, start.toISOString().slice(0, 10)),
				sql`${dailyStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	return db
		.select({
			path: dailyStats.path,
			views: sum(dailyStats.views).mapWith(Number)
		})
		.from(dailyStats)
		.where(dateFilter)
		.groupBy(dailyStats.path)
		.orderBy(desc(sum(dailyStats.views)))
		.limit(limit);
}

/** Top referrers by total count. */
export async function getTopReferrers(range: DateRange, limit = 10, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const refFilter = start
		? and(
				gte(referrerStats.date, start.toISOString().slice(0, 10)),
				sql`${referrerStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	return db
		.select({
			referrer: referrerStats.referrer,
			count: sum(referrerStats.count).mapWith(Number)
		})
		.from(referrerStats)
		.where(refFilter)
		.groupBy(referrerStats.referrer)
		.orderBy(desc(sum(referrerStats.count)))
		.limit(limit);
}

/** Country breakdown. */
export async function getGeoBreakdown(range: DateRange, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const geoFilter = start
		? and(
				gte(geoStats.date, start.toISOString().slice(0, 10)),
				sql`${geoStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	return db
		.select({
			country: geoStats.country,
			count: sum(geoStats.count).mapWith(Number)
		})
		.from(geoStats)
		.where(geoFilter)
		.groupBy(geoStats.country)
		.orderBy(desc(sum(geoStats.count)))
		.limit(20);
}

/** Device type breakdown. */
export async function getDeviceBreakdown(range: DateRange, from?: string, to?: string) {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const devFilter = start
		? and(
				gte(deviceStats.date, start.toISOString().slice(0, 10)),
				sql`${deviceStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	const devices = await db
		.select({
			deviceType: deviceStats.deviceType,
			count: sum(deviceStats.count).mapWith(Number)
		})
		.from(deviceStats)
		.where(devFilter)
		.groupBy(deviceStats.deviceType)
		.orderBy(desc(sum(deviceStats.count)));

	const browsers = await db
		.select({
			browser: deviceStats.browser,
			count: sum(deviceStats.count).mapWith(Number)
		})
		.from(deviceStats)
		.where(devFilter)
		.groupBy(deviceStats.browser)
		.orderBy(desc(sum(deviceStats.count)))
		.limit(8);

	return { devices, browsers };
}

// ───── CSV Export ─────────────────────────────────────────────────────────────

/** Generate a CSV of daily_stats for a date range. Sanitized to prevent formula injection. */
export async function exportCsv(range: DateRange, from?: string, to?: string): Promise<string> {
	const start = from ? new Date(from) : getRangeStart(range);
	const end = to ? new Date(to) : new Date();

	const dateFilter = start
		? and(
				gte(dailyStats.date, start.toISOString().slice(0, 10)),
				sql`${dailyStats.date} <= ${end.toISOString().slice(0, 10)}::date`
			)
		: undefined;

	const rows = await db
		.select({
			date: dailyStats.date,
			path: dailyStats.path,
			views: dailyStats.views,
			uniqueViews: dailyStats.uniqueViews
		})
		.from(dailyStats)
		.where(dateFilter)
		.orderBy(dailyStats.date, dailyStats.path);

	const header = 'date,path,views,unique_views\n';
	const body = rows
		.map((r) => {
			// Sanitize: prefix cells starting with = + - @ to prevent formula injection
			const sanitize = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v);
			return `${r.date},${sanitize(r.path)},${r.views},${r.uniqueViews}`;
		})
		.join('\n');

	return header + body;
}

// ───── Live count (raw page_views today) ─────────────────────────────────────

/** Approximate "active" indicator: views in last 5 minutes. */
export async function getActiveNow(): Promise<number> {
	const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
	const [row] = await db
		.select({ c: count() })
		.from(pageViews)
		.where(gte(pageViews.createdAt, fiveMinAgo));
	return row?.c ?? 0;
}
