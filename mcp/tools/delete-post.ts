import { z } from 'zod';
import { api } from '../utils/api-client.js';

export const deletePostSchema = z.object({
  id: z.number().int().positive()
});

export async function deletePost(input: z.infer<typeof deletePostSchema>) {
  await api.delete<{ ok: boolean }>(`/api/admin/blogs/${input.id}`);
  return { deleted: true, id: input.id };
}
