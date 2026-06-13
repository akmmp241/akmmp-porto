import { z } from 'zod';
import { db, schema } from '../db.js';
import { rawSlug, ensureUniqueSlug, findSlugConflict } from '../utils/slug.js';
import { parseEditorJsContent, computeEditorJsReadingTime } from '../utils/editorjs.js';
import { buildPostResponse, fetchPostTags } from '../utils/post-response.js';
import { syncPostTags, refreshSearchIndex } from '../utils/db-helpers.js';

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
  const parsed = parseEditorJsContent(input.content);
  const readingTime = computeEditorJsReadingTime(parsed);

  let finalSlug: string;
  if (input.slug) {
    const conflict = await findSlugConflict(input.slug);
    if (conflict !== null) throw new Error(`Slug "${input.slug}" is already in use`);
    finalSlug = input.slug;
  } else {
    finalSlug = await ensureUniqueSlug(rawSlug(input.titleEn));
  }

  const [row] = await db
    .insert(schema.blogPosts)
    .values({
      slug: finalSlug,
      title: { en: input.titleEn, id: input.titleId },
      excerpt: { en: input.excerptEn, id: input.excerptId },
      content: input.content,
      contentFormat: 'editorjs',
      coverImage: input.coverImage ?? null,
      published: false,
      publishedAt: null,
      readingTime
    })
    .returning();

  if (!row) throw new Error('Insert failed');

  if (input.tags.length > 0) {
    await syncPostTags(row.id, input.tags);
  }
  await refreshSearchIndex();

  const tags = await fetchPostTags(row.id);
  return buildPostResponse(row, tags);
}
