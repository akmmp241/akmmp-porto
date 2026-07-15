import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { listPostsSchema, listPosts } from './tools/list-posts.js';
import { getPostBaseSchema, getPost } from './tools/get-post.js';
import { createPostSchema, createPost } from './tools/create-post.js';
import { updatePostSchema, updatePost } from './tools/update-post.js';
import { publishPostSchema, publishPost } from './tools/publish-post.js';
import { unpublishPostSchema, unpublishPost } from './tools/unpublish-post.js';
import { deletePostSchema, deletePost } from './tools/delete-post.js';
import { generateSlugSchema, generateSlug } from './tools/generate-slug.js';

const server = new McpServer({
  name: 'blog-management',
  version: '1.0.0'
});

function wrapTool<T>(fn: (input: T) => Promise<unknown> | unknown) {
  return async (input: T) => {
    try {
      const result = await fn(input);
      return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true
      };
    }
  };
}

server.tool('list_posts', 'List blog posts with optional status filter', listPostsSchema.shape, wrapTool(listPosts));
server.tool('get_post', 'Get a single blog post by id or slug', getPostBaseSchema.shape, wrapTool(getPost));
server.tool('create_post', 'Create a new draft blog post with Editor.js content', createPostSchema.shape, wrapTool(createPost));
server.tool('update_post', 'Update fields of an existing blog post', updatePostSchema.shape, wrapTool(updatePost));
server.tool('publish_post', 'Set a blog post to published', publishPostSchema.shape, wrapTool(publishPost));
server.tool('unpublish_post', 'Revert a blog post to draft', unpublishPostSchema.shape, wrapTool(unpublishPost));
server.tool('delete_post', 'Hard-delete a blog post and prune orphan tags', deletePostSchema.shape, wrapTool(deletePost));
server.tool('generate_slug', 'Generate a URL slug from a title string', generateSlugSchema.shape, wrapTool(generateSlug));

const transport = new StdioServerTransport();
await server.connect(transport).catch((err) => {
  console.error('MCP server failed to start:', err);
  process.exit(1);
});
