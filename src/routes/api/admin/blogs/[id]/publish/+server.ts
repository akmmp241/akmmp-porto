import { json, type RequestEvent } from '@sveltejs/kit';
import { authorize, actorAuditUserId, actorMetadata, type AdminActor } from '$lib/server/admin-auth';
import { BlogServiceError, publishPost } from '$lib/server/blog-service';
import { logAction } from '$lib/server/audit';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';

function errorJson(error: unknown): Response {
	if (error instanceof BlogServiceError) return json({ error: error.failure }, { status: error.status });
	return json({ error: { code: 'INTERNAL_ERROR', message: 'Internal error' } }, { status: 500 });
}

function rateKey(actor: AdminActor): string {
	return `admin-api:${actor.kind}:${actor.kind === 'mcp' ? actor.apiKeyId : actor.userId}`;
}

export async function POST(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:publish');
	if ('response' in auth) return auth.response;
	const id = Number(event.params.id);
	if (!Number.isInteger(id) || id <= 0) return json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid id' } }, { status: 400 });
	const limited = await checkRateLimit(rateKey(auth.actor), 30, 30, 60_000);
	const headers = getRateLimitHeaders(30, limited.remaining, limited.resetAt, limited.allowed);
	if (!limited.allowed) return json({ error: { code: 'RATE_LIMITED', message: 'Too many requests' } }, { status: 429, headers });
	try {
		const post = await publishPost(id);
		await logAction(actorAuditUserId(auth.actor), 'blog.publish', `blog:${id}`, actorMetadata(auth.actor), event.getClientAddress());
		return json({ post });
	} catch (error) {
		return errorJson(error);
	}
}
