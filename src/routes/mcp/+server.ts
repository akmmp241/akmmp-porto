import { json, type RequestHandler } from '@sveltejs/kit';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { authenticateMcpKey } from '$lib/server/api-key';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';
import { createBlogMcpServer } from '$lib/server/mcp/blog-server';

async function handle(request: Request, ip: string): Promise<Response> {
	const key = await authenticateMcpKey(request.headers.get('authorization'));
	if (!key) {
		return json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or revoked API key' } }, { status: 401 });
	}

	const limited = await checkRateLimit(`mcp:${key.keyId}`, 60, 60, 60_000);
	if (!limited.allowed) {
		return json(
			{ error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
			{ status: 429, headers: getRateLimitHeaders(60, limited.remaining, limited.resetAt, false) }
		);
	}

	const server = createBlogMcpServer({
		userId: key.userId,
		apiKeyId: key.keyId,
		scopes: key.scopes,
		ipAddress: ip
	});
	const transport = new WebStandardStreamableHTTPServerTransport({
		sessionIdGenerator: undefined,
		enableJsonResponse: true
	});
	await server.connect(transport);
	return transport.handleRequest(request);
}

export const POST: RequestHandler = ({ request, getClientAddress }) => handle(request, getClientAddress());
export const GET: RequestHandler = ({ request, getClientAddress }) => handle(request, getClientAddress());
export const DELETE: RequestHandler = ({ request, getClientAddress }) => handle(request, getClientAddress());
