import GithubSlugger from 'github-slugger';
import { eq, and, ne } from 'drizzle-orm';
import { db, schema } from '../db.js';

const slugger = new GithubSlugger();

export function rawSlug(title: string): string {
  slugger.reset();
  return slugger.slug(title);
}

export async function ensureUniqueSlug(
  base: string,
  excludeId?: number
): Promise<string> {
  let candidate = base;
  let suffix = 1;

  while (true) {
    const where =
      excludeId !== undefined
        ? and(eq(schema.blogPosts.slug, candidate), ne(schema.blogPosts.id, excludeId))
        : eq(schema.blogPosts.slug, candidate);

    const [row] = await db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).where(where);

    if (!row) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

export async function findSlugConflict(
  slug: string,
  excludeId?: number
): Promise<number | null> {
  const where =
    excludeId !== undefined
      ? and(eq(schema.blogPosts.slug, slug), ne(schema.blogPosts.id, excludeId))
      : eq(schema.blogPosts.slug, slug);

  const [row] = await db.select({ id: schema.blogPosts.id }).from(schema.blogPosts).where(where);
  return row ? row.id : null;
}
