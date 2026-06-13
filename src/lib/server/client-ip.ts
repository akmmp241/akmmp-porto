import type { RequestEvent } from '@sveltejs/kit';

/**
 * Resolve the real client IP behind a trusted reverse proxy / tunnel.
 * Header priority:
 *   1. CF-Connecting-IP — set by Cloudflare, overwrites client value
 *   2. X-Forwarded-For (leftmost) — generic proxy chain
 *   3. X-Real-IP — nginx-style fallback
 *   4. TCP peer address
 * Only safe when the app is exposed exclusively through the trusted edge.
 */
export function getClientIp(event: RequestEvent): string {
	const cf = event.request.headers.get('cf-connecting-ip');
	if (cf) return cf.trim();

	const xff = event.request.headers.get('x-forwarded-for');
	if (xff) {
		const first = xff.split(',')[0]?.trim();
		if (first) return first;
	}

	const real = event.request.headers.get('x-real-ip');
	if (real) return real.trim();

	try {
		return event.getClientAddress() ?? '0.0.0.0';
	} catch {
		return '0.0.0.0';
	}
}
