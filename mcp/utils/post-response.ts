import { eq } from 'drizzle-orm';
import { db, schema } from '../db.js';

export interface PostResponse {
  id: number;
  slug: string;
  title: { en: string; id: string };
  excerpt: { en: string; id: string };
  content: string;
  contentFormat: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  readingTime: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PostSummary {
  id: number;
  slug: string;
  title: { en: string; id: string };
  published: boolean;
  publishedAt: string | null;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

export async function fetchPostTags(postId: number): Promise<string[]> {
  const rows = await db
    .select({ name: schema.tags.name })
    .from(schema.blogPostTags)
    .innerJoin(schema.tags, eq(schema.blogPostTags.tagId, schema.tags.id))
    .where(eq(schema.blogPostTags.postId, postId));
  return rows.map((r) => r.name);
}

export function buildPostResponse(
  post: typeof schema.blogPosts.$inferSelect,
  tags: string[]
): PostResponse {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    content: typeof post.content === 'string' ? post.content : JSON.stringify(post.content),
    contentFormat: post.contentFormat,
    coverImage: post.coverImage ?? null,
    published: post.published,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingTime: post.readingTime,
    tags,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
}

export function buildPostSummary(
  post: typeof schema.blogPosts.$inferSelect
): PostSummary {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    published: post.published,
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    readingTime: post.readingTime,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString()
  };
}
