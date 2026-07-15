import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const getPostBaseSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().min(1).optional()
});

export const getPostSchema = getPostBaseSchema.refine((d) => d.id !== undefined || d.slug !== undefined, {
  message: 'Provide either id or slug'
});

export async function getPost(input: z.infer<typeof getPostSchema>) {
  if (input.id !== undefined) {
    const { post } = await api.get<{ post: unknown }>(`/api/admin/blogs/${input.id}`);
    return post;
  }
  const { posts } = await api.get<{ posts: Array<{ slug: string; id: number }> }>('/api/admin/blogs?limit=100');
  const match = posts.find((post) => post.slug === input.slug);
  if (!match) throw new Error('Post not found');
  const { post } = await api.get<{ post: unknown }>(`/api/admin/blogs/${match.id}`);
  return post;
}
