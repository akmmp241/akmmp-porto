import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const listPostsSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().min(0).default(0)
});

export async function listPosts(input: z.infer<typeof listPostsSchema>) {
  const params = new URLSearchParams();
  if (input.status) params.set('status', input.status);
  params.set('limit', String(input.limit));
  params.set('offset', String(input.offset));
  const { posts } = await api.get<{ posts: unknown[] }>(`/api/admin/blogs?${params}`);
  return posts;
}
