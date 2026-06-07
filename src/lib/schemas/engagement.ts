import { z } from 'zod';

export const contactFormSchema = z.object({
	name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
	email: z.string().trim().email('Please enter a valid email address'),
	subject: z.string().trim().max(200, 'Subject is too long').optional(),
	message: z
		.string()
		.trim()
		.min(10, 'Message must be at least 10 characters')
		.max(2000, 'Message is too long'),
	honeypot: z.string().max(0, 'Spam detected'),
	_loadedAt: z.string().regex(/^\d+$/)
});

export type ContactFormSchema = typeof contactFormSchema;

export const guestbookFormSchema = z.object({
	author: z
		.string()
		.trim()
		.min(2, 'Author name must be at least 2 characters')
		.max(50, 'Author name is too long'),
	message: z
		.string()
		.trim()
		.min(10, 'Message must be at least 10 characters')
		.max(500, 'Message is too long'),
	honeypot: z.string().max(0, 'Spam detected'),
	_loadedAt: z.string().regex(/^\d+$/)
});

export type GuestbookFormSchema = typeof guestbookFormSchema;
