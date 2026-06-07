import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { contactFormSchema } from '$lib/schemas/engagement';
import { checkRateLimit, getRateLimitHeaders } from '$lib/server/rate-limit';
import { db } from '$lib/server/db';
import { contactMessages } from '$lib/server/db/schema';
import { sendContactNotification } from '$lib/server/email';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod(contactFormSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, getClientAddress, setHeaders }) => {
		const form = await superValidate(request, zod(contactFormSchema));

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

		// 3. Rate limiting (max 3 submissions per IP per hour)
		// capacity = 3, refill rate = 1 per hour (3600000 ms)
		const rateLimit = await checkRateLimit(`contact:${ip}`, 3, 1, 3600000);
		setHeaders(getRateLimitHeaders(3, rateLimit.remaining, rateLimit.resetAt, rateLimit.allowed));

		if (!rateLimit.allowed) {
			return message(form, 'Please try again later', { status: 429 });
		}

		// 4. Save to DB
		try {
			await db.insert(contactMessages).values({
				name: form.data.name,
				email: form.data.email,
				subject: form.data.subject || null,
				message: form.data.message,
				ipAddress: ip
			});
		} catch (error) {
			console.error('Failed to save contact message to DB:', error);
			return message(form, 'An unexpected error occurred. Please try again.', { status: 500 });
		}

		// 5. Send Email
		await sendContactNotification({
			name: form.data.name,
			email: form.data.email,
			subject: form.data.subject,
			message: form.data.message
		});

		return message(form, 'Message sent successfully!');
	}
};
