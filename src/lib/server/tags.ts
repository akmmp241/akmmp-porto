/**
 * Tag helpers — server-side.
 *
 * Sync a comma-separated tag string to the join table for a post:
 * 1. Normalize names (trim, dedupe)
 * 2. Upsert into `tags`
 * 3. Replace `blog_post_tags` rows for the post
 */
import { eq, notInArray } from 'drizzle-orm';
import { db } from './db';
import { tags as tagsTable, blogPostTags } from './db/schema';

const slugify = (s: string) =>
	s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.slice(0, 60);

export function parseTagCsv(raw: string): string[] {
	const seen = new Set<string>();
	const out: string[] = [];
	for (const part of raw.split(',')) {
		const name = part.trim();
		if (!name) continue;
		const key = name.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(name);
	}
	return out;
}

export async function syncPostTags(postId: number, names: string[]): Promise<void> {
	const tagIds: number[] = [];
	for (const name of names) {
		const slug = slugify(name);
		if (!slug) continue;
		const [existing] = await db.select().from(tagsTable).where(eq(tagsTable.slug, slug));
		if (existing) {
			tagIds.push(existing.id);
			continue;
		}
		const [inserted] = await db
			.insert(tagsTable)
			.values({ name, slug })
			.onConflictDoNothing({ target: tagsTable.slug })
			.returning();
		if (inserted) tagIds.push(inserted.id);
		else {
			const [again] = await db.select().from(tagsTable).where(eq(tagsTable.slug, slug));
			if (again) tagIds.push(again.id);
		}
	}

	await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
	if (tagIds.length === 0) return;
	await db
		.insert(blogPostTags)
		.values(tagIds.map((tagId) => ({ postId, tagId })))
		.onConflictDoNothing();
}

/** Drop tags that no longer have any posts. */
export async function pruneOrphanTags(): Promise<void> {
	const used = await db.selectDistinct({ id: blogPostTags.tagId }).from(blogPostTags);
	const usedIds = used.map((u) => u.id);
	if (usedIds.length === 0) {
		await db.delete(tagsTable);
		return;
	}
	await db.delete(tagsTable).where(notInArray(tagsTable.id, usedIds));
}
