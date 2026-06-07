/**
 * Seed script — populates DB from static data + creates admin user.
 *
 * Run: bun run db:seed
 *
 * Reads ADMIN_EMAIL + ADMIN_PASSWORD from env (defaults if absent).
 * Idempotent: skips inserts when rows exist.
 */
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hash } from '@node-rs/argon2';
import {
	authUser,
	projects,
	experiences,
	skillGroups,
	siteSettings
} from '../src/lib/server/db/schema';
import { projects as staticProjects } from '../src/lib/data/projects';
import { experiences as staticExperiences } from '../src/lib/data/experience';
import { skillGroups as staticSkillGroups } from '../src/lib/data/skills';
import { about } from '../src/lib/data/about';
import { site } from '../src/lib/data/site';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL not set');

const sql = postgres(url);
const db = drizzle(sql);

const ARGON_OPTS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

function genUserId() {
	const bytes = new Uint8Array(15);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function seedAdmin() {
	const email = process.env.ADMIN_EMAIL ?? 'admin@example.com';
	const password = process.env.ADMIN_PASSWORD ?? 'admin1234';
	const name = process.env.ADMIN_NAME ?? 'Admin';

	const [existing] = await db.select().from(authUser).where(eq(authUser.email, email));
	if (existing) {
		console.log(`✓ admin '${email}' already exists`);
		return;
	}
	const hashedPassword = await hash(password, ARGON_OPTS);
	await db.insert(authUser).values({
		id: genUserId(),
		email,
		name,
		role: 'admin',
		hashedPassword
	});
	console.log(`✓ created admin '${email}' (password: ${password})`);
}

async function seedProjects() {
	const existing = await db.select().from(projects);
	if (existing.length > 0) {
		console.log(`✓ projects already seeded (${existing.length} rows)`);
		return;
	}
	for (const p of staticProjects) {
		await db.insert(projects).values({
			slug: p.slug,
			title: p.title,
			description: p.description,
			techstack: p.techstack,
			image: p.image ?? null,
			badges: p.badges,
			featured: p.featured,
			order: p.order
		});
	}
	console.log(`✓ seeded ${staticProjects.length} projects`);
}

async function seedExperiences() {
	const existing = await db.select().from(experiences);
	if (existing.length > 0) {
		console.log(`✓ experiences already seeded (${existing.length} rows)`);
		return;
	}
	for (let i = 0; i < staticExperiences.length; i++) {
		const e = staticExperiences[i];
		await db.insert(experiences).values({
			title: e.title,
			company: e.company,
			location: e.location ?? null,
			startDate: e.startDate,
			endDate: e.endDate ?? null,
			current: e.current ?? false,
			description: e.description,
			skills: e.skills,
			type: e.type,
			order: i
		});
	}
	console.log(`✓ seeded ${staticExperiences.length} experiences`);
}

async function seedSkills() {
	const existing = await db.select().from(skillGroups);
	if (existing.length > 0) {
		console.log(`✓ skill groups already seeded (${existing.length} rows)`);
		return;
	}
	for (let i = 0; i < staticSkillGroups.length; i++) {
		const g = staticSkillGroups[i];
		await db.insert(skillGroups).values({
			title: g.title,
			items: g.items,
			order: i
		});
	}
	console.log(`✓ seeded ${staticSkillGroups.length} skill groups`);
}

async function seedSettings() {
	const rows: Array<{ key: string; value: unknown }> = [
		{ key: 'about', value: about },
		{ key: 'site', value: site }
	];
	for (const r of rows) {
		const [existing] = await db.select().from(siteSettings).where(eq(siteSettings.key, r.key));
		if (existing) {
			console.log(`✓ site_settings.${r.key} already exists`);
			continue;
		}
		await db.insert(siteSettings).values(r);
		console.log(`✓ seeded site_settings.${r.key}`);
	}
}

async function main() {
	try {
		await seedAdmin();
		await seedProjects();
		await seedExperiences();
		await seedSkills();
		await seedSettings();
		console.log('\n✅ seed complete');
	} catch (err) {
		console.error('seed failed:', err);
		process.exitCode = 1;
	} finally {
		await sql.end();
	}
}

main();
