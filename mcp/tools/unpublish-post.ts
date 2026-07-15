import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const unpublishPostSchema = z.object({
  id: z.number().int().positive()
});

export async function unpublishPost(input: z.infer<typeof unpublishPostSchema>) {
  const { post } = await api.post<{ post: unknown }>(`/api/admin/blogs/${input.id}/unpublish`);
  return post;
}
