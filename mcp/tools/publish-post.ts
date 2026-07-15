import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db.js';
import { buildPostResponse, fetchPostTags } from '../utils/post-response.js';
import { refreshSearchIndex } from '../utils/db-helpers.js';

export const publishPostSchema = z.object({
  id: z.number().int().positive()
});

export async function publishPost(input: z.infer<typeof publishPostSchema>) {
  const [existing] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
  if (!existing) throw new Error('Post not found');

  const now = new Date();
  await db
    .update(schema.blogPosts)
    .set({ published: true, publishedAt: now, updatedAt: now })
    .where(eq(schema.blogPosts.id, input.id));

  await refreshSearchIndex();

  const [updated] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
  const tags = await fetchPostTags(input.id);
  return buildPostResponse(updated, tags);
}
