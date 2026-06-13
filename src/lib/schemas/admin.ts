import { z } from 'zod/v3';

const translatable = z.object({
	en: z.string().min(1, 'Required'),
	id: z.string().min(1, 'Required')
});

const optionalUrl = z.string().trim().url().or(z.literal('')).optional();

export const projectFormSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1, 'Required')
		.regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, dashes only'),
	title: z.string().trim().min(1, 'Required'),
	descriptionEn: z.string().trim().min(1, 'Required'),
	descriptionId: z.string().trim().min(1, 'Required'),
	techstack: z.string().default(''), // CSV → split server-side
	image: z.string().trim().optional(),
	badgeFe: optionalUrl,
	badgeBe: optionalUrl,
	badgeLive: optionalUrl,
	featured: z.boolean().default(false)
});
export type ProjectFormSchema = typeof projectFormSchema;

export const experienceFormSchema = z.object({
	title: z.string().trim().min(1, 'Required'),
	company: z.string().trim().min(1, 'Required'),
	location: z.string().trim().optional(),
	startDate: z.string().trim().min(1, 'Required'),
	endDate: z.string().trim().optional(),
	current: z.boolean().default(false),
	descriptionEn: z.string().trim().min(1, 'Required'),
	descriptionId: z.string().trim().min(1, 'Required'),
	skills: z.string().default(''),
	type: z.enum(['work', 'education', 'intern', 'project'])
});
export type ExperienceFormSchema = typeof experienceFormSchema;

export const skillGroupFormSchema = z.object({
	titleEn: z.string().trim().min(1, 'Required'),
	titleId: z.string().trim().min(1, 'Required'),
	items: z.string().default('')
});
export type SkillGroupFormSchema = typeof skillGroupFormSchema;

export const aboutSettingsSchema = z.object({
	headlineEn: z.string().trim().min(1, 'Required'),
	headlineId: z.string().trim().min(1, 'Required'),
	paragraphsEn: z.string().trim().min(1, 'Required'), // newline-separated
	paragraphsId: z.string().trim().min(1, 'Required'),
	socials: z
		.array(
			z.object({
				platform: z.enum(['github', 'email', 'linkedin', 'instagram', 'discord']),
				label: z.string().min(1),
				url: z.string().min(1)
			})
		)
		.default([])
});
export type AboutSettingsSchema = typeof aboutSettingsSchema;

export const siteSettingsFormSchema = z.object({
	siteName: z.string().trim().min(1, 'Required'),
	owner: z.string().trim().min(1, 'Required'),
	ogImage: z.string().trim().min(1, 'Required'),
	baseUrl: z.string().trim().url('Must be a valid URL')
});
export type SiteSettingsFormSchema = typeof siteSettingsFormSchema;

export const reorderSchema = z.object({
	ids: z.array(z.number().int())
});

export const blogPostFormSchema = z.object({
	slug: z
		.string()
		.trim()
		.min(1, 'Required')
		.regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, dashes only'),
	titleEn: z.string().trim().min(1, 'Required'),
	titleId: z.string().trim().min(1, 'Required'),
	excerptEn: z.string().trim().min(1, 'Required').max(280, 'Max 280 chars'),
	excerptId: z.string().trim().min(1, 'Required').max(280, 'Max 280 chars'),
	content: z.string().min(1, 'Required'),
	contentFormat: z.enum(['markdown', 'editorjs']).default('editorjs'),
	coverImage: z.string().trim().default(''),
	tags: z.string().default(''), // CSV → split server-side
	published: z.boolean().default(false),
	publishedAt: z.string().trim().default('')
});
export type BlogPostFormSchema = typeof blogPostFormSchema;

export const caseStudyFormSchema = z.object({
	contentEn: z.string().default(''),
	contentId: z.string().default(''),
	gallery: z.string().default('') // newline-separated paths
});
export type CaseStudyFormSchema = typeof caseStudyFormSchema;
