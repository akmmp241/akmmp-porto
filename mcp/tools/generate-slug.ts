import { z } from 'zod';

export const generateSlugSchema = z.object({
  title: z.string().min(1)
});

export function generateSlug(input: z.infer<typeof generateSlugSchema>) {
  const slug = input.title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return { slug };
}
