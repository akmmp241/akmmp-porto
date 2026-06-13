import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db.js';
import { findSlugConflict } from '../utils/slug.js';
import { parseEditorJsContent, computeEditorJsReadingTime } from '../utils/editorjs.js';
import { buildPostResponse, fetchPostTags } from '../utils/post-response.js';
import { syncPostTags, pruneOrphanTags, refreshSearchIndex } from '../utils/db-helpers.js';

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
  const [existing] = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.id, input.id));
  if (!existing) throw new Error('Post not found');

  if (input.slug) {
    const conflict = await findSlugConflict(input.slug, input.id);
    if (conflict !== null) throw new Error(`Slug "${input.slug}" is already in use`);
  }

  let readingTime = existing.readingTime;
  if (input.content !== undefined) {
    const parsed = parseEditorJsContent(input.content);
    readingTime = computeEditorJsReadingTime(parsed);
  }

  const newTitle = {
    en: input.titleEn ?? existing.title.en,
    id: input.titleId ?? existing.title.id
  };

  const newExcerpt = {
    en: input.excerptEn ?? existing.excerpt.en,
    id: input.excerptId ?? existing.excerpt.id
  };

  const updates: Partial<typeof schema.blogPosts.$inferInsert> & { updatedAt: Date } = {
    title: newTitle,
    excerpt: newExcerpt,
    readingTime,
    updatedAt: new Date()
  };

  if (input.slug !== undefined) updates.slug = input.slug;
  if (input.content !== undefined) {
    updates.content = input.content;
    updates.contentFormat = 'editorjs';
  }
  if ('coverImage' in input) updates.coverImage = input.coverImage ?? null;

  await db.update(schema.blogPosts).set(updates).where(eq(schema.blogPosts.id, input.id));

  if (input.tags !== undefined) {
    await syncPostTags(input.id, input.tags);
    await pruneOrphanTags();
  }
  await refreshSearchIndex();

  const [updated] = await db.select().from(schema.blogPosts).where(eq(schema.blogPosts.id, input.id));
  const tags = await fetchPostTags(input.id);
  return buildPostResponse(updated, tags);
}
