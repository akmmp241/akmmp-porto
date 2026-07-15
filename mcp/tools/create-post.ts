import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const createPostSchema = z.object({
  titleEn: z.string().min(1),
  titleId: z.string().default(''),
  content: z.string().min(1),
  excerptEn: z.string().default(''),
  excerptId: z.string().default(''),
  tags: z.array(z.string()).default([]),
  slug: z.string().min(1).optional(),
  coverImage: z.string().optional()
});

export async function createPost(input: z.infer<typeof createPostSchema>) {
  const { post } = await api.post<{ post: unknown }>('/api/admin/blogs', input);
  return post;
}
