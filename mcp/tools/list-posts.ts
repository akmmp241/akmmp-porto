import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db, schema } from '../db.js';
import { buildPostSummary } from '../utils/post-response.js';

export const listPostsSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  limit: z.number().int().positive().default(20),
  offset: z.number().int().min(0).default(0)
});

export async function listPosts(
  input: z.infer<typeof listPostsSchema>
) {
  const { status, limit, offset } = input;

  const query = db
    .select()
    .from(schema.blogPosts)
    .orderBy(desc(schema.blogPosts.createdAt))
    .limit(limit)
    .offset(offset);

  let rows: (typeof schema.blogPosts.$inferSelect)[];

  if (status === 'published') {
    rows = await query.where(eq(schema.blogPosts.published, true));
  } else if (status === 'draft') {
    rows = await query.where(eq(schema.blogPosts.published, false));
  } else {
    rows = await query;
  }

  return rows.map(buildPostSummary);
}
