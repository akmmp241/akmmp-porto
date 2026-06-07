import { experienceSchema, type Experience } from './schemas';

const raw: Experience[] = [
	{
		id: '1',
		title: 'Software Engineer Intern',
		company: 'Nine Dragon Lab',
		location: 'Semarang, Jawa Tengah',
		startDate: 'Oct 2024',
		endDate: 'Dec 2024',
		description: {
			en: 'Trusted to handle an international client. Built a warehouse management project with OCR and QR scanning features.',
			id: 'Dipercaya menangani klien internasional. Membangun proyek warehouse management dengan fitur OCR dan QR scanning.'
		},
		skills: ['Laravel', 'Filament', 'React', 'Tesseract'],
		type: 'intern'
	},
	{
		id: '2',
		title: 'Software Engineer Intern',
		company: 'Kodingworks',
		location: 'Semarang, Jawa Tengah & Remote',
		startDate: 'Jul 2024',
		endDate: 'Sep 2024',
		description: {
			en: 'Developed an LMS website with online video features and built a web-based payment aggregator integrated with Xendit.',
			id: 'Mengembangkan website LMS dengan fitur video online dan membangun payment aggregator berbasis web yang terintegrasi dengan Xendit.'
		},
		skills: ['Next.js', 'Laravel', 'Xendit', 'Docker'],
		type: 'intern'
	},
	{
		id: '3',
		title: 'Web Developer & Team Lead',
		company: 'SMK Negeri 8 Semarang',
		location: 'Semarang, Jawa Tengah',
		startDate: 'Jul 2024',
		endDate: 'Oct 2024',
		description: {
			en: 'Led the PEMILOS election web project, integrated a system-wide monitoring solution, and built a live count feature using WebSocket.',
			id: 'Memimpin proyek web PEMILOS, mengintegrasikan solusi monitoring system-wide, dan membangun fitur live count berbasis WebSocket.'
		},
		skills: ['Laravel', 'Pusher', 'Grafana', 'Loki', 'Prometheus', 'Docker'],
		type: 'project'
	},
	{
		id: '4',
		title: 'Web Developer Intern',
		company: 'Dinustek',
		location: 'Semarang, Jawa Tengah',
		startDate: 'Oct 2023',
		endDate: 'Dec 2023',
		description: {
			en: 'Learned Dinustek core Laravel environment and contributed to internal web-based project management.',
			id: 'Mempelajari environment Laravel inti Dinustek dan berkontribusi pada project management berbasis web internal.'
		},
		skills: ['Laravel'],
		type: 'intern'
	}
];

export const experiences: Experience[] = raw.map((e) => experienceSchema.parse(e));
