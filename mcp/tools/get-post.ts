import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db.js';
import { buildPostResponse, fetchPostTags } from '../utils/post-response.js';

export const getPostBaseSchema = z.object({
  id: z.number().int().positive().optional(),
  slug: z.string().min(1).optional()
});

export const getPostSchema = getPostBaseSchema
  .refine((d) => d.id !== undefined || d.slug !== undefined, {
    message: 'Provide either id or slug'
  });

export async function getPost(input: z.infer<typeof getPostSchema>) {
  const { id, slug } = input;

  const [row] = id !== undefined
    ? await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, id))
    : await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.slug, slug!));

  if (!row) throw new Error('Post not found');

  const tags = await fetchPostTags(row.id);
  return buildPostResponse(row, tags);
}
