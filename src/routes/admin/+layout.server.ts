import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { contactMessages, guestbookEntries } from '$lib/server/db/schema';
import { count, eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	// /admin/login is public; all others require auth
	if (url.pathname !== '/admin/login' && !locals.user) {
		throw redirect(302, '/admin/login');
	}

	if (!locals.user) {
		return { user: null, unreadMessages: 0, pendingGuestbook: 0 };
	}

	// Fetch badges counts for admin layout
	const [[m], [g]] = await Promise.all([
		db.select({ c: count() }).from(contactMessages).where(eq(contactMessages.read, false)),
		db.select({ c: count() }).from(guestbookEntries).where(eq(guestbookEntries.approved, false))
	]);

	return {
		user: locals.user,
		unreadMessages: m.c,
		pendingGuestbook: g.c
	};
};

