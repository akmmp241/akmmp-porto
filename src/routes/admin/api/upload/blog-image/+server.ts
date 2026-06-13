import { json, error } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/server/rate-limit';
import { saveBlogImage } from '$lib/server/upload';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, getClientAddress }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const ip = getClientAddress();
	const rateLimitKey = `upload:blog:${ip}`;
	try {
		await checkRateLimit(rateLimitKey, 10, 60_000);
	} catch {
		throw error(429, 'Too many upload requests');
	}

	const formData = await request.formData();
	const file = formData.get('image');

	if (!(file instanceof File)) {
		throw error(400, 'No image file provided');
	}

	try {
		const url = await saveBlogImage(file);
		return json({
			success: 1,
			file: { url }
		});
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}
		throw error(500, 'Failed to upload image');
	}
};
