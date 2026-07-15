import { json, type RequestEvent } from '@sveltejs/kit';
import { authorize, actorAuditUserId, actorMetadata, type AdminActor } from '$lib/server/admin-auth';
import { BlogServiceError, deletePost, getPost, updatePost } from '$lib/server/blog-service';
import { logAction } from '$lib/server/audit';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';

function parseId(params: Partial<Record<string, string>>): number | Response {
	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) return json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id' } }, { status: 400 });
	return id;
}

function errorJson(error: unknown): Response {
	if (error instanceof BlogServiceError) return json({ error: error.failure }, { status: error.status });
	return json({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } }, { status: 500 });
}

async function rateLimit(key: string): Promise<Response | null> {
	const result = await checkRateLimit(key, 30, 30, 60_000);
	const headers = getRateLimitHeaders(30, result.remaining, result.resetAt, result.allowed);
	if (!result.allowed) return json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429, headers });
	return null;
}

function rateKey(actor: AdminActor): string {
	return `admin-api:${actor.kind}:${actor.kind === 'mcp' ? actor.apiKeyId : actor.userId}`;
}

export async function GET(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:read');
	if ('response' in auth) return auth.response;
	const id = parseId(event.params);
	if (id instanceof Response) return id;
	try {
		return json({ post: await getPost({ id }) });
	} catch (error) {
		return errorJson(error);
	}
}

export async function PATCH(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:update_draft');
	if ('response' in auth) return auth.response;
	const id = parseId(event.params);
	if (id instanceof Response) return id;
	const limited = await rateLimit(rateKey(auth.actor));
	if (limited) return limited;
	try {
		const post = await updatePost({ id, ...(await event.request.json()) });
		await logAction(actorAuditUserId(auth.actor), 'blog.update', `blog:${id}`, actorMetadata(auth.actor), event.getClientAddress());
		return json({ post });
	} catch (error) {
		return errorJson(error);
	}
}

export async function DELETE(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:delete');
	if ('response' in auth) return auth.response;
	const id = parseId(event.params);
	if (id instanceof Response) return id;
	const limited = await rateLimit(rateKey(auth.actor));
	if (limited) return limited;
	try {
		await deletePost(id);
		await logAction(actorAuditUserId(auth.actor), 'blog.delete', `blog:${id}`, actorMetadata(auth.actor), event.getClientAddress());
		return json({ ok: true });
	} catch (error) {
		return errorJson(error);
	}
}
