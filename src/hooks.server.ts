import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server.js';
import {
	SESSION_COOKIE_NAME,
	clearSessionCookie,
	setSessionCookie,
	validateSessionToken
} from '$lib/server/auth';
import { trackPageView, isBot } from '$lib/server/analytics';
import { getClientIp } from '$lib/server/client-ip';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		event.locals.lang = locale as 'en' | 'id';
		return resolve(event, {
			transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
		});
	});

const handleClientIp: Handle = ({ event, resolve }) => {
	event.locals.ip = getClientIp(event);
	return resolve(event);
};

const handleAuth: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE_NAME);
	if (!token) {
		event.locals.user = null;
		event.locals.session = null;
	} else {
		const { session, user } = await validateSessionToken(token);
		if (session) setSessionCookie(event.cookies, token, session.expiresAt);
		else clearSessionCookie(event.cookies);
		event.locals.user = user;
		event.locals.session = session;
	}
	return resolve(event);
};

const handleAdminGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	if (path.startsWith('/admin') && path !== '/admin/login') {
		if (!event.locals.user) {
			throw redirect(302, '/admin/login');
		}
	}
	if (path === '/admin/login' && event.locals.user) {
		throw redirect(302, '/admin');
	}
	return resolve(event);
};

/**
 * Tracks page views for every public HTML page request.
 * - Skips /admin/*, /api/*, static assets, and bot user-agents.
 * - Fires asynchronously so it never blocks page loads.
 * - No PII stored (no raw IP, no cookies).
 */
const handleAnalytics: Handle = async ({ event, resolve }) => {
	const response = resolve(event);

	const path = event.url.pathname;
	const ua = event.request.headers.get('user-agent') ?? '';

	// Skip non-HTML requests, admin/API paths, static files, and bots
	const skipPrefixes = ['/admin', '/api', '/_app', '/_svelte', '/favicon'];
	const isStaticAsset = /\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?|ttf|map)$/i.test(path);
	const isSkipped = skipPrefixes.some((p) => path.startsWith(p)) || isStaticAsset || isBot(ua);

	if (!isSkipped) {
		// Only track HTML navigations — check Accept header
		const accept = event.request.headers.get('accept') ?? '';
		if (accept.includes('text/html')) {
			const ip = event.locals.ip;
			const referrer = event.request.headers.get('referer');

			// Fire-and-forget — errors logged inside trackPageView, never surface to user
			trackPageView({ path, referrer, userAgent: ua, ip }).catch(() => {});
		}
	}

	return response;
};

export const handle: Handle = sequence(handleParaglide, handleClientIp, handleAuth, handleAdminGuard, handleAnalytics);

