import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { siteSettings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import {
	aboutSettingsSchema,
	siteSettingsFormSchema
} from '$lib/schemas/admin';
import { aboutSchema, siteSchema } from '$lib/data/schemas';

type AboutValue = ReturnType<typeof aboutSchema.parse>;
type SiteValue = ReturnType<typeof siteSchema.parse>;

async function loadAbout(): Promise<AboutValue | null> {
	const [row] = await db
		.select()
		.from(siteSettings)
		.where(eq(siteSettings.key, 'about'));
	if (!row) return null;
	return aboutSchema.parse(row.value);
}

async function loadSite(): Promise<SiteValue | null> {
	const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, 'site'));
	if (!row) return null;
	return siteSchema.parse(row.value);
}

async function upsert(key: string, value: unknown) {
	await db
		.insert(siteSettings)
		.values({ key, value: value as object })
		.onConflictDoUpdate({ target: siteSettings.key, set: { value: value as object } });
}

export const load: PageServerLoad = async () => {
	const [aboutVal, siteVal] = await Promise.all([loadAbout(), loadSite()]);

	const aboutForm = await superValidate(
		aboutVal
			? {
					headlineEn: aboutVal.headline.en,
					headlineId: aboutVal.headline.id,
					paragraphsEn: aboutVal.paragraphs.map((p) => p.en).join('\n\n'),
					paragraphsId: aboutVal.paragraphs.map((p) => p.id).join('\n\n'),
					socials: aboutVal.socials
				}
			: undefined,
		zod(aboutSettingsSchema)
	);

	const siteForm = await superValidate(
		siteVal ?? undefined,
		zod(siteSettingsFormSchema)
	);

	return { aboutForm, siteForm };
};

export const actions: Actions = {
	saveAbout: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const form = await superValidate(request, zod(aboutSettingsSchema));
		if (!form.valid) return fail(400, { aboutForm: form });

		const splitParas = (s: string) =>
			s
				.split(/\n{2,}/)
				.map((p) => p.trim())
				.filter(Boolean);

		const enParas = splitParas(form.data.paragraphsEn);
		const idParas = splitParas(form.data.paragraphsId);

		const len = Math.max(enParas.length, idParas.length);
		const paragraphs = Array.from({ length: len }, (_, i) => ({
			en: enParas[i] ?? '',
			id: idParas[i] ?? ''
		}));

		const value: AboutValue = {
			headline: { en: form.data.headlineEn, id: form.data.headlineId },
			paragraphs,
			socials: form.data.socials
		};

		await upsert('about', value);
		return { aboutForm: form, savedAbout: true };
	},
	saveSite: async ({ request, locals }) => {
		if (!locals.user) throw error(401);
		const form = await superValidate(request, zod(siteSettingsFormSchema));
		if (!form.valid) return fail(400, { siteForm: form });
		await upsert('site', form.data);
		return { siteForm: form, savedSite: true };
	}
};
