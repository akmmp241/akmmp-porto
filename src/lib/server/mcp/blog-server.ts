import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
	createPost,
	generateSlug,
	generateUniqueSlug,
	getDraftPost,
	listPosts,
	updateDraftPost,
	type BlogPostDto
} from '$lib/server/blog-service';
import { logAction } from '$lib/server/audit';
import type { Scope } from '$lib/server/api-key';

export interface McpActor {
	userId: string;
	apiKeyId: number;
	scopes: Scope[];
	ipAddress: string;
}

function requireScope(actor: McpActor, scope: Scope): void {
	if (!actor.scopes.includes(scope)) throw new Error(`Missing scope: ${scope}`);
}

function result(value: unknown) {
	return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function failure(error: unknown) {
	const message = error instanceof Error ? error.message : 'Request failed';
	return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
}

async function audited(actor: McpActor, action: string, post: BlogPostDto): Promise<BlogPostDto> {
	await logAction(actor.userId, action, `blog:${post.id}`, { actor: 'mcp', apiKeyId: actor.apiKeyId }, actor.ipAddress);
	return post;
}

export function createBlogMcpServer(actor: McpActor): McpServer {
	const server = new McpServer({ name: 'blog-management', version: '2.0.0' });

	server.tool(
		'list_posts',
		'List draft blog posts',
		{ status: z.literal('draft').default('draft'), limit: z.number().int().min(1).max(100).default(20), offset: z.number().int().min(0).default(0) },
		async ({ limit, offset }) => {
			try {
				requireScope(actor, 'blog:read');
				return result(await listPosts({ status: 'draft', limit, offset }));
			} catch (error) {
				return failure(error);
			}
		}
	);

	server.tool(
		'get_post',
		'Get one draft blog post by id or slug',
		{ id: z.number().int().positive().optional(), slug: z.string().min(1).optional() },
		async (input) => {
			try {
				requireScope(actor, 'blog:read');
				if (input.id === undefined && input.slug === undefined) throw new Error('id or slug is required');
				return result(await getDraftPost(input));
			} catch (error) {
				return failure(error);
			}
		}
	);

	server.tool(
		'create_post',
		'Create a draft blog post with Editor.js content',
		{
			titleEn: z.string().min(1),
			titleId: z.string().min(1),
			excerptEn: z.string().min(1).max(280),
			excerptId: z.string().min(1).max(280),
			content: z.string().min(1),
			tags: z.array(z.string()).default([]),
			slug: z.string().min(1).optional(),
			coverImage: z.string().nullable().optional()
		},
		async (input) => {
			try {
				requireScope(actor, 'blog:create_draft');
				const post = await createPost({ ...input, authorId: actor.userId });
				return result(await audited(actor, 'blog.create_draft', post));
			} catch (error) {
				return failure(error);
			}
		}
	);

	server.tool(
		'update_post',
		'Update one draft blog post',
		{
			id: z.number().int().positive(),
			titleEn: z.string().min(1).optional(),
			titleId: z.string().min(1).optional(),
			excerptEn: z.string().min(1).max(280).optional(),
			excerptId: z.string().min(1).max(280).optional(),
			content: z.string().min(1).optional(),
			tags: z.array(z.string()).optional(),
			slug: z.string().min(1).optional(),
			coverImage: z.string().nullable().optional()
		},
		async ({ id, ...input }) => {
			try {
				requireScope(actor, 'blog:update_draft');
				return result(await audited(actor, 'blog.update_draft', await updateDraftPost({ id, ...input })));
			} catch (error) {
				return failure(error);
			}
		}
	);

	server.tool(
		'generate_slug',
		'Generate a lowercase blog slug',
		{ title: z.string().min(1) },
		async ({ title }) => {
			try {
				requireScope(actor, 'blog:read');
				return result({ slug: await generateUniqueSlug(title) || generateSlug(title) });
			} catch (error) {
				return failure(error);
			}
		}
	);

	return server;
}
