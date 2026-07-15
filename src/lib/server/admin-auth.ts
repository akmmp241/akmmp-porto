/**
 * Unified auth guard for /api/admin/* routes.
 *
 * Supports two actor types:
 *  - admin: signed-in via session cookie (event.locals.user) — has all scopes
 *  - mcp: Bearer API key — limited to scopes attached to the key row
 */
import type { RequestEvent } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { verifyBearer, type Scope } from './api-key';

export type AdminActor =
	| { kind: 'admin'; userId: string }
	| { kind: 'mcp'; apiKeyId: number; scopes: Scope[] };

export interface AuthFailure {
	response: Response;
}

export interface AuthSuccess {
	actor: AdminActor;
}

export type AuthResult = AuthSuccess | AuthFailure;

function errorResponse(status: number, code: string, message: string): Response {
	return json({ error: { code, message } }, { status });
}

export async function authenticate(event: RequestEvent): Promise<AuthResult> {
	if (event.locals.user?.role === 'admin') {
		return { actor: { kind: 'admin', userId: event.locals.user.id } };
	}
	const header = event.request.headers.get('authorization');
	if (header) {
		const verified = await verifyBearer(header);
		if (!verified) {
			return {
				response: errorResponse(401, 'UNAUTHORIZED', 'Invalid or revoked API key')
			};
		}
		return {
			actor: { kind: 'mcp', apiKeyId: verified.keyId, scopes: verified.scopes }
		};
	}
	return { response: errorResponse(401, 'UNAUTHORIZED', 'Authentication required') };
}

export function requireScope(actor: AdminActor, scope: Scope): Response | null {
	if (actor.kind === 'admin') return null;
	if (actor.scopes.includes(scope)) return null;
	return errorResponse(403, 'FORBIDDEN', `Missing scope: ${scope}`);
}

export async function authorize(
	event: RequestEvent,
	scope: Scope
): Promise<{ actor: AdminActor } | { response: Response }> {
	const result = await authenticate(event);
	if ('response' in result) return result;
	const denied = requireScope(result.actor, scope);
	if (denied) return { response: denied };
	return { actor: result.actor };
}

export function actorAuditUserId(actor: AdminActor): string | null {
	return actor.kind === 'admin' ? actor.userId : null;
}

export function actorMetadata(actor: AdminActor): Record<string, unknown> {
	if (actor.kind === 'admin') return { actor: 'admin' };
	return { actor: 'mcp', apiKeyId: actor.apiKeyId };
}
