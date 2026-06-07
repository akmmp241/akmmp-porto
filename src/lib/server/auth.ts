import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { authSession, authUser, type AuthSession, type AuthUser } from './db/schema';

const DAY_MS = 1000 * 60 * 60 * 24;
export const SESSION_COOKIE_NAME = 'session';
const SESSION_DURATION_MS = DAY_MS * 30;
const SESSION_REFRESH_THRESHOLD_MS = DAY_MS * 15;

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeHexLowerCase(sha256(bytes));
}

function tokenToSessionId(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(token: string, userId: string): Promise<AuthSession> {
	const id = tokenToSessionId(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	const [session] = await db.insert(authSession).values({ id, userId, expiresAt }).returning();
	return session;
}

export type SessionValidationResult =
	| { session: AuthSession; user: SafeUser }
	| { session: null; user: null };

export type SafeUser = Pick<AuthUser, 'id' | 'email' | 'name' | 'role'>;

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const id = tokenToSessionId(token);
	const [row] = await db
		.select({
			session: authSession,
			user: {
				id: authUser.id,
				email: authUser.email,
				name: authUser.name,
				role: authUser.role
			}
		})
		.from(authSession)
		.innerJoin(authUser, eq(authSession.userId, authUser.id))
		.where(eq(authSession.id, id));

	if (!row) return { session: null, user: null };

	const now = Date.now();
	if (now >= row.session.expiresAt.getTime()) {
		await db.delete(authSession).where(eq(authSession.id, id));
		return { session: null, user: null };
	}

	// Sliding window: refresh if within threshold
	if (now >= row.session.expiresAt.getTime() - SESSION_REFRESH_THRESHOLD_MS) {
		const expiresAt = new Date(now + SESSION_DURATION_MS);
		await db.update(authSession).set({ expiresAt }).where(eq(authSession.id, id));
		row.session.expiresAt = expiresAt;
	}

	return { session: row.session, user: row.user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(authSession).where(eq(authSession.id, sessionId));
}

export async function invalidateAllSessions(userId: string): Promise<void> {
	await db.delete(authSession).where(eq(authSession.userId, userId));
}

export function setSessionCookie(
	cookies: import('@sveltejs/kit').Cookies,
	token: string,
	expiresAt: Date
) {
	cookies.set(SESSION_COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		expires: expiresAt
	});
}

export function clearSessionCookie(cookies: import('@sveltejs/kit').Cookies) {
	cookies.set(SESSION_COOKIE_NAME, '', {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !import.meta.env.DEV,
		maxAge: 0
	});
}
