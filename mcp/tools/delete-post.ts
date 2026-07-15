import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db.js';
import { pruneOrphanTags, refreshSearchIndex } from '../utils/db-helpers.js';

export const deletePostSchema = z.object({
  id: z.number().int().positive()
});

export async function deletePost(input: z.infer<typeof deletePostSchema>) {
  const [existing] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
  if (!existing) throw new Error('Post not found');

  // blog_post_tags cascades on delete, so no manual join-table cleanup needed.
  await db.delete(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
  await pruneOrphanTags();
  await refreshSearchIndex();

  return { deleted: true, id: input.id };
}
