import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { projects, experiences, skillGroups, contactMessages, guestbookEntries } from '$lib/server/db/schema';
import { count, eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [[p], [e], [s], [pf], [m], [g]] = await Promise.all([
		db.select({ c: count() }).from(projects),
		db.select({ c: count() }).from(experiences),
		db.select({ c: count() }).from(skillGroups),
		db.select({ c: count() }).from(projects).where(eq(projects.featured, true)),
		db.select({ c: count() }).from(contactMessages).where(eq(contactMessages.read, false)),
		db.select({ c: count() }).from(guestbookEntries).where(eq(guestbookEntries.approved, false))
	]);

	const recentProjects = await db
		.select({
			id: projects.id,
			slug: projects.slug,
			title: projects.title,
			updatedAt: projects.updatedAt,
			featured: projects.featured
		})
		.from(projects)
		.orderBy(desc(projects.updatedAt))
		.limit(5);

	return {
		stats: {
			projects: p.c,
			featured: pf.c,
			experiences: e.c,
			skillGroups: s.c,
			unreadMessages: m.c,
			pendingGuestbook: g.c
		},
		recentProjects
	};
};

