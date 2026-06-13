import { sql, eq, notInArray } from 'drizzle-orm';
import { db, schema } from '../db.js';

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

export async function syncPostTags(postId: number, names: string[]): Promise<void> {
  const tagIds: number[] = [];
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const [existing] = await db.select().from(schema.tags).where(eq(schema.tags.slug, slug));
    if (existing) { tagIds.push(existing.id); continue; }
    const [inserted] = await db
      .insert(schema.tags).values({ name, slug })
      .onConflictDoNothing({ target: schema.tags.slug }).returning();
    if (inserted) { tagIds.push(inserted.id); continue; }
    const [again] = await db.select().from(schema.tags).where(eq(schema.tags.slug, slug));
    if (again) tagIds.push(again.id);
  }
  await db.transaction(async (tx) => {
    await tx.delete(schema.blogPostTags).where(eq(schema.blogPostTags.postId, postId));
    if (tagIds.length > 0) {
      await tx.insert(schema.blogPostTags)
        .values(tagIds.map((tagId) => ({ postId, tagId })))
        .onConflictDoNothing();
    }
  });
}

export async function pruneOrphanTags(): Promise<void> {
  const used = await db.selectDistinct({ id: schema.blogPostTags.tagId }).from(schema.blogPostTags);
  const usedIds = used.map((u) => u.id);
  if (usedIds.length === 0) return;
  await db.delete(schema.tags).where(notInArray(schema.tags.id, usedIds));
}

export async function refreshSearchIndex(): Promise<void> {
  try {
    await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY search_index`);
  } catch {
    try {
      await db.execute(sql`REFRESH MATERIALIZED VIEW search_index`);
    } catch {
      // MV may not exist yet; silently ignore.
    }
  }
}
