import { aboutSchema, type About } from './schemas';

const raw: About = {
	headline: {
		en: "Hello, I'm Akmal!",
		id: 'Halo, saya Akmal!'
	},
	paragraphs: [
		{
			en: "I'm a software engineer who focuses on building reliable and scalable backend applications. I enjoy designing systems that are clean, efficient, and dependable in the long run.",
			id: 'Saya seorang software engineer yang fokus membangun aplikasi backend yang andal dan mudah di-scale. Saya suka merancang sistem yang rapi, efisien, dan bisa diandalkan dalam jangka panjang.'
		},
		{
			en: "Throughout my journey I've worked on various projects—from developing backend services and improving application performance to integrating modern technologies that support business needs.",
			id: 'Selama perjalanan saya, saya telah mengerjakan berbagai proyek mulai dari membangun layanan backend, meningkatkan performa aplikasi, hingga mengintegrasikan teknologi modern untuk mendukung kebutuhan bisnis.'
		}
	],
	socials: [
		{ platform: 'github', label: 'akmmp241', url: 'https://github.com/akmmp241' },
		{ platform: 'email', label: 'akmalmp241@gmail.com', url: 'mailto:akmalmp241@gmail.com' },
		{
			platform: 'linkedin',
			label: 'akmalmuhammadp',
			url: 'https://www.linkedin.com/in/akmalmuhammadp/'
		},
		{ platform: 'instagram', label: 'akm.mp_', url: 'https://instagram.com/akm.mp_' },
		{ platform: 'discord', label: 'akmalmp', url: '#' }
	]
};

export const about: About = aboutSchema.parse(raw);
