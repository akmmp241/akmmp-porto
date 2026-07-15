import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const updatePostSchema = z.object({
  id: z.number().int().positive(),
  titleEn: z.string().min(1).optional(),
  titleId: z.string().optional(),
  content: z.string().optional(),
  excerptEn: z.string().optional(),
  excerptId: z.string().optional(),
  slug: z.string().min(1).optional(),
  coverImage: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export async function updatePost(input: z.infer<typeof updatePostSchema>) {
  const { id, ...body } = input;
  const { post } = await api.patch<{ post: unknown }>(`/api/admin/blogs/${id}`, body);
  return post;
}
