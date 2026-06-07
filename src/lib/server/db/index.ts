import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

const connectionString = env.DATABASE_URL;

if (!connectionString) {
	throw new Error('DATABASE_URL is not set. Run `bun run db:up` and copy .env.example → .env');
}

export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
