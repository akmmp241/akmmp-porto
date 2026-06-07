import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { guestbookFormSchema } from '$lib/schemas/engagement';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';
import { db } from '$lib/server/db';
import { guestbookEntries } from '$lib/server/db/schema';
import { eq, desc, count } from 'drizzle-orm';
import DOMPurify from 'isomorphic-dompurify';

export const load: PageServerLoad = async ({ url }) => {
	const form = await superValidate(zod(guestbookFormSchema));

	const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
	const limit = 20;
	const offset = (page - 1) * limit;

	// Fetch only approved entries
	const entries = await db
		.select()
		.from(guestbookEntries)
		.where(eq(guestbookEntries.approved, true))
		.orderBy(desc(guestbookEntries.createdAt))
		.limit(limit)
		.offset(offset);

	const [totalCountResult] = await db
		.select({ c: count() })
		.from(guestbookEntries)
		.where(eq(guestbookEntries.approved, true));
	
	const totalEntries = totalCountResult?.c || 0;
	const totalPages = Math.ceil(totalEntries / limit);

	return {
		form,
		entries,
		pagination: {
			page,
			limit,
			totalEntries,
			totalPages
		}
	};
};

export const actions: Actions = {
	default: async ({ request, getClientAddress, setHeaders }) => {
		const form = await superValidate(request, zod(guestbookFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const ip = getClientAddress();

		// 1. Honeypot check
		if (form.data.honeypot) {
			return fail(400, { form });
		}

		// 2. Time check (must take > 3 seconds since page load)
		const loadedAt = parseInt(form.data._loadedAt, 10);
		const timeElapsed = Date.now() - loadedAt;
		if (isNaN(loadedAt) || timeElapsed < 3000) {
			return fail(400, { form });
		}

		// 3. Rate limiting (max 2 entries per IP per hour)
		const rateLimit = await checkRateLimit(`guestbook:${ip}`, 2, 1, 3600000);
		setHeaders(getRateLimitHeaders(2, rateLimit.remaining, rateLimit.resetAt, rateLimit.allowed));

		if (!rateLimit.allowed) {
			return message(form, 'Please try again later', { status: 429 });
		}

		// 4. Sanitize entries server-side
		const cleanAuthor = DOMPurify.sanitize(form.data.author);
		const cleanMessage = DOMPurify.sanitize(form.data.message);

		// 5. Insert into DB (approved = false, goes to moderation queue)
		try {
			await db.insert(guestbookEntries).values({
				author: cleanAuthor,
				message: cleanMessage,
				ipAddress: ip,
				approved: false
			});
		} catch (error) {
			console.error('Failed to save guestbook entry:', error);
			return message(form, 'An unexpected error occurred. Please try again.', { status: 500 });
		}

		return message(form, 'Thank you! Your message has been submitted to the moderation queue.');
	}
};
