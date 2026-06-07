import type { Actions, RequestEvent } from '@sveltejs/kit';
import { saveProjectImage } from '$lib/server/upload';
import { json, error } from '@sveltejs/kit';

export const POST = async ({ request, locals }: RequestEvent) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const fd = await request.formData();
	const file = fd.get('file');
	if (!(file instanceof File)) throw error(400, 'No file');
	const url = await saveProjectImage(file);
	return json({ url });
};
