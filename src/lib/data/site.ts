import { siteSchema, type Site } from './schemas';

export const site: Site = siteSchema.parse({
	siteName: 'AkmalMP - Portfolio',
	owner: 'Akmal Muhammad Pridianto',
	ogImage: '/akm-2.png',
	baseUrl: 'https://akmalmp.my.id'
});
