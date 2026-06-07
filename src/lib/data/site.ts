import { siteSchema, type Site } from './schemas';

export const site: Site = siteSchema.parse({
	siteName: 'AkmalMP - Portfolio',
	owner: 'Akmal Muhammad Pridianto',
	ogImage: '/og?title=Akmal%20MP&subtitle=Software%20Engineer&kind=page',
	baseUrl: 'https://akmalmp.my.id'
});
