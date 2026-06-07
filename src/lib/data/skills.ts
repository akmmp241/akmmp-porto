import { skillGroupSchema, type SkillGroup } from './schemas';

export const iconCloudSlugs: string[] = [
	'typescript',
	'nextdotjs',
	'postgresql',
	'nginx',
	'docker',
	'git',
	'github',
	'apachekafka',
	'go',
	'laravel',
	'mysql',
	'redis',
	'googlecloud',
	'rust',
	'grafana',
	'prometheus'
];

export const iconCloudExternal: string[] = [
	'https://shecancode.io/wp-content/uploads/2022/04/aws.png'
];

const rawGroups: SkillGroup[] = [
	{
		title: { en: 'Languages & Frameworks', id: 'Bahasa & Framework' },
		items: ['Go', 'Rust', 'TypeScript', 'Laravel', 'Next.js']
	},
	{
		title: { en: 'Databases', id: 'Database' },
		items: ['PostgreSQL', 'MySQL', 'Redis']
	},
	{
		title: { en: 'Cloud', id: 'Cloud' },
		items: ['AWS', 'GCP']
	},
	{
		title: { en: 'Monitoring', id: 'Monitoring' },
		items: ['Grafana', 'Prometheus', 'Loki']
	},
	{
		title: { en: 'Other Tools', id: 'Tools Lain' },
		items: ['Git', 'GitHub', 'Docker', 'Nginx']
	}
];

export const skillGroups: SkillGroup[] = rawGroups.map((g) => skillGroupSchema.parse(g));
