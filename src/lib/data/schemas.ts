import { z } from 'zod';

export const translatable = z.object({ en: z.string(), id: z.string() });
export type Translatable = z.infer<typeof translatable>;

export const projectSchema = z.object({
	slug: z.string(),
	title: z.string(),
	description: translatable,
	techstack: z.array(z.string()),
	image: z.string().optional(),
	badges: z.object({
		fe: z.string().optional(),
		be: z.string().optional(),
		live: z.string().optional()
	}),
	featured: z.boolean(),
	order: z.number()
});
export type Project = z.infer<typeof projectSchema>;

export const experienceSchema = z.object({
	id: z.string(),
	title: z.string(),
	company: z.string(),
	location: z.string().optional(),
	startDate: z.string(),
	endDate: z.string().optional(),
	current: z.boolean().optional(),
	description: translatable,
	skills: z.array(z.string()),
	type: z.enum(['work', 'education', 'project', 'intern'])
});
export type Experience = z.infer<typeof experienceSchema>;

export const skillGroupSchema = z.object({
	title: translatable,
	items: z.array(z.string())
});
export type SkillGroup = z.infer<typeof skillGroupSchema>;

export const socialSchema = z.object({
	platform: z.enum(['github', 'email', 'linkedin', 'instagram', 'discord']),
	label: z.string(),
	url: z.string()
});
export type Social = z.infer<typeof socialSchema>;

export const aboutSchema = z.object({
	headline: translatable,
	paragraphs: z.array(translatable),
	socials: z.array(socialSchema)
});
export type About = z.infer<typeof aboutSchema>;

export const siteSchema = z.object({
	siteName: z.string(),
	owner: z.string(),
	ogImage: z.string(),
	baseUrl: z.string()
});
export type Site = z.infer<typeof siteSchema>;
