/// <reference types="@sveltejs/kit" />
import type { SafeUser } from '$lib/server/auth';
import type { AuthSession } from '$lib/server/db/schema';

declare global {
	namespace App {
		interface Locals {
			lang: 'en' | 'id';
			user: SafeUser | null;
			session: AuthSession | null;
		}
	}
}

export {};
