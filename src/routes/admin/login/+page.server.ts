import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate, message } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { authUser } from '$lib/server/db/schema';
import { verifyPassword } from '$lib/server/password';
import {
	createSession,
	generateSessionToken,
	setSessionCookie
} from '$lib/server/auth';
import { loginSchema } from '$lib/schemas/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/admin');
	const form = await superValidate(zod(loginSchema));
	return { form };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod(loginSchema));
		if (!form.valid) return fail(400, { form });

		const [user] = await db
			.select()
			.from(authUser)
			.where(eq(authUser.email, form.data.email.toLowerCase()));

		if (!user) {
			return message(form, 'Invalid email or password', { status: 401 });
		}

		const ok = await verifyPassword(user.hashedPassword, form.data.password);
		if (!ok) {
			return message(form, 'Invalid email or password', { status: 401 });
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id);
		setSessionCookie(cookies, token, session.expiresAt);

		throw redirect(302, '/admin');
	}
};
