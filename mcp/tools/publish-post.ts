import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const publishPostSchema = z.object({
  id: z.number().int().positive()
});

export async function publishPost(input: z.infer<typeof publishPostSchema>) {
  const { post } = await api.post<{ post: unknown }>(`/api/admin/blogs/${input.id}/publish`);
  return post;
}
