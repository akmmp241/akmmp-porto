import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';
import { ALL_SCOPES, createApiKey, listApiKeys, revokeApiKey, type Scope } from '$lib/server/api-key';
import { logAction } from '$lib/server/audit';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw error(403);
	return { keys: await listApiKeys(), scopes: ALL_SCOPES };
};

function parseScopes(formData: FormData): Scope[] {
	const selected = formData.getAll('scopes').map(String);
	return selected.filter((scope): scope is Scope => (ALL_SCOPES as readonly string[]).includes(scope));
}

export const actions: Actions = {
	create: async ({ request, locals, getClientAddress }) => {
		if (locals.user?.role !== 'admin') throw error(403);
		const formData = await request.formData();
		const label = String(formData.get('label') ?? '').trim();
		const scopes = parseScopes(formData);
		if (!label) return fail(400, { error: 'Label is required' });
		if (scopes.length === 0) return fail(400, { error: 'Select at least one scope' });
		const key = await createApiKey(locals.user.id, label, scopes);
		await logAction(locals.user.id, 'api_key.create', `api_key:${key.id}`, { label, scopes }, getClientAddress());
		return { created: key };
	},
	revoke: async ({ request, locals, getClientAddress }) => {
		if (locals.user?.role !== 'admin') throw error(403);
		const formData = await request.formData();
		const id = Number(formData.get('id'));
		if (!Number.isInteger(id) || id <= 0) return fail(400, { error: 'Invalid id' });
		await revokeApiKey(id);
		await logAction(locals.user.id, 'api_key.revoke', `api_key:${id}`, {}, getClientAddress());
		return { revoked: true };
	}
};
