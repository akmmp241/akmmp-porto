import { z } from 'zod';
import { rawSlug } from '../utils/slug.js';

export const generateSlugSchema = z.object({
  title: z.string().min(1)
});

export function generateSlug(input: z.infer<typeof generateSlugSchema>) {
  return { slug: rawSlug(input.title) };
}
