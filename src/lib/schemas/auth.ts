import { z } from 'zod/v3';

export const loginSchema = z.object({
	email: z.string().email('Invalid email'),
	password: z.string().min(8, 'At least 8 characters')
});

export type LoginSchema = typeof loginSchema;
