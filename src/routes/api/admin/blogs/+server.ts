import { json, type RequestEvent } from '@sveltejs/kit';
import { authorize, actorAuditUserId, actorMetadata } from '$lib/server/admin-auth';
import { BlogServiceError, createPost, listPosts } from '$lib/server/blog-service';
import { logAction } from '$lib/server/audit';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';

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

export async function GET(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:read');
	if ('response' in auth) return auth.response;
	const statusRaw = event.url.searchParams.get('status');
	const status = statusRaw === 'draft' || statusRaw === 'published' ? statusRaw : undefined;
	const limit = Number(event.url.searchParams.get('limit') ?? 20);
	const offset = Number(event.url.searchParams.get('offset') ?? 0);
	return json({ posts: await listPosts({ status, limit, offset }) });
}

export async function POST(event: RequestEvent): Promise<Response> {
	const auth = await authorize(event, 'blog:create_draft');
	if ('response' in auth) return auth.response;
	const limited = await rateLimit(`admin-api:${auth.actor.kind}:${auth.actor.kind === 'mcp' ? auth.actor.apiKeyId : auth.actor.userId}`);
	if (limited) return limited;
	try {
		const body = await event.request.json();
		const post = await createPost({ ...body, authorId: auth.actor.kind === 'admin' ? auth.actor.userId : null });
		await logAction(actorAuditUserId(auth.actor), 'blog.create_draft', `blog:${post.id}`, actorMetadata(auth.actor), event.getClientAddress());
		return json({ post }, { status: 201 });
	} catch (error) {
		return errorJson(error);
	}
}
