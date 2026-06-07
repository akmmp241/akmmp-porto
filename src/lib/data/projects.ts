import { projectSchema, type Project } from './schemas';

const raw: Project[] = [
	{
		slug: 'powerup',
		title: 'PowerUP',
		description: {
			en: 'Top Up platform with multiple online payment integrations.',
			id: 'Platform Top Up dengan beragam integrasi pembayaran online.'
		},
		techstack: ['Next.js', 'TypeScript', 'Laravel', 'Xendit', 'MySQL'],
		image: '/powerup.webp',
		badges: {
			fe: 'https://github.com/akmmp241/powerup-client-service',
			be: 'https://github.com/akmmp241/powerup-rest-service',
			live: 'https://powerup.akmalmp.my.id'
		},
		featured: true,
		order: 1
	},
	{
		slug: 'akmalstore',
		title: 'AkmalStore',
		description: {
			en: 'API service for an online top up platform built on a microservice architecture.',
			id: 'Layanan API untuk platform top up online dengan arsitektur microservice.'
		},
		techstack: ['Go', 'Postgres', 'Xendit', 'Kafka', 'Docker', 'Redis'],
		image: '/akmalstore.jpeg',
		badges: {
			be: 'https://github.com/akmmp241/topupstore-microservice'
		},
		featured: true,
		order: 2
	},
	{
		slug: 'evia',
		title: 'Evia',
		description: {
			en: 'Mobile app for recognizing external wounds, powered by GeminiAPI.',
			id: 'Aplikasi mobile untuk mengenali luka luar, dengan bantuan GeminiAPI.'
		},
		techstack: ['Go', 'Redis', 'Postgres', 'Expo', 'GeminiAPI'],
		image: '/evia.webp',
		badges: {
			be: 'https://github.com/akmmp241/dinacom-go-rest'
		},
		featured: true,
		order: 3
	}
];

export const projects: Project[] = raw.map((p) => projectSchema.parse(p));
