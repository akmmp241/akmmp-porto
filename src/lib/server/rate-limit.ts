import { db } from './db';
import { rateLimits } from './db/schema';
import { eq } from 'drizzle-orm';

interface RateLimitResult {
	allowed: boolean;
	remaining: number;
	resetAt: Date;
}

/**
 * Token-bucket rate limiter.
 * 
 * @param key Unique key for the rate limit (e.g. "contact:127.0.0.1")
 * @param maxTokens Maximum capacity of the bucket
 * @param refillRate Number of tokens refilled per interval
 * @param refillIntervalMs Interval in milliseconds for token refill
 */
export async function checkRateLimit(
	key: string,
	maxTokens: number,
	refillRate: number,
	refillIntervalMs: number
): Promise<RateLimitResult> {
	const now = new Date();
	const [record] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));

	if (!record) {
		// First request, initialize bucket with maxTokens - 1
		const initialTokens = maxTokens - 1;
		await db.insert(rateLimits).values({
			key,
			tokens: initialTokens,
			lastReset: now
		});

		return {
			allowed: true,
			remaining: initialTokens,
			resetAt: new Date(now.getTime() + refillIntervalMs)
		};
	}

	// Calculate refilled tokens since last reset
	const elapsedMs = now.getTime() - record.lastReset.getTime();
	const intervalsElapsed = Math.floor(elapsedMs / refillIntervalMs);
	
	let currentTokens = record.tokens;
	let lastReset = record.lastReset;

	if (intervalsElapsed > 0) {
		const refilled = intervalsElapsed * refillRate;
		currentTokens = Math.min(maxTokens, currentTokens + refilled);
		// Update lastReset by the exact elapsed intervals to avoid drifting
		lastReset = new Date(record.lastReset.getTime() + intervalsElapsed * refillIntervalMs);
	}

	const nextRefillMs = lastReset.getTime() + refillIntervalMs - now.getTime();
	const resetAt = new Date(now.getTime() + nextRefillMs);

	if (currentTokens > 0) {
		const newTokens = currentTokens - 1;
		await db
			.update(rateLimits)
			.set({
				tokens: newTokens,
				lastReset
			})
			.where(eq(rateLimits.key, key));

		return {
			allowed: true,
			remaining: newTokens,
			resetAt
		};
	} else {
		// Not enough tokens
		return {
			allowed: false,
			remaining: 0,
			resetAt
		};
	}
}

/**
 * Generates Rate Limit headers for standard response.
 */
export function getRateLimitHeaders(limit: number, remaining: number, resetAt: Date, allowed: boolean) {
	const now = Date.now();
	const retryAfter = Math.max(0, Math.ceil((resetAt.getTime() - now) / 1000));
	
	const headers: Record<string, string> = {
		'X-RateLimit-Limit': limit.toString(),
		'X-RateLimit-Remaining': remaining.toString(),
		'X-RateLimit-Reset': Math.ceil(resetAt.getTime() / 1000).toString()
	};

	if (!allowed) {
		headers['Retry-After'] = retryAfter.toString();
	}

	return headers;
}
