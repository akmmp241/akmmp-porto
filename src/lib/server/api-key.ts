/**
 * API key management for the admin blog API.
 *
 * Keys are stored hashed (sha256) — only the prefix is shown after creation.
 * Bearer tokens carry scope strings checked at the route layer.
 */
import { encodeHexLowerCase } from '@oslojs/encoding';
import { sha256 } from '@oslojs/crypto/sha2';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from './db';
import { apiKeys, type ApiKeyRow } from './db/schema';

export const ALL_SCOPES = ['blog:read', 'blog:create_draft', 'blog:update_draft'] as const;

export type Scope = (typeof ALL_SCOPES)[number];

const RAW_KEY_BYTES = 32;
const PREFIX_LEN = 8;

export function generateRawKey(): string {
	const bytes = new Uint8Array(RAW_KEY_BYTES);
	crypto.getRandomValues(bytes);
	return encodeHexLowerCase(bytes);
}

export function hashKey(raw: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(raw)));
}

export interface CreatedApiKey {
	id: number;
	label: string;
	prefix: string;
	scopes: Scope[];
	rawKey: string;
}

export async function createApiKey(userId: string, label: string, scopes: Scope[]): Promise<CreatedApiKey> {
	const rawKey = generateRawKey();
	const hashedKey = hashKey(rawKey);
	const prefix = rawKey.slice(0, PREFIX_LEN);

	const [row] = await db
		.insert(apiKeys)
		.values({ userId, label, hashedKey, prefix, scopes })
		.returning({ id: apiKeys.id });

	return { id: row.id, label, prefix, scopes, rawKey };
}

export interface VerifiedKey {
	keyId: number;
	userId: string;
	scopes: Scope[];
}

export async function authenticateMcpKey(authHeader: string | null): Promise<VerifiedKey | null> {
	return verifyBearer(authHeader);
}

export async function verifyBearer(authHeader: string | null): Promise<VerifiedKey | null> {
	if (!authHeader) return null;
	const match = authHeader.match(/^Bearer\s+([a-f0-9]{64})$/i);
	if (!match) return null;

	const hashedKey = hashKey(match[1]);
	const [row] = await db
		.select()
		.from(apiKeys)
		.where(and(eq(apiKeys.hashedKey, hashedKey), isNull(apiKeys.revokedAt)));

	if (!row) return null;

	void db.update(apiKeys).set({ lastUsedAt: new Date() }).where(eq(apiKeys.id, row.id));

	return { keyId: row.id, userId: row.userId, scopes: row.scopes as Scope[] };
}

export async function revokeApiKey(id: number): Promise<void> {
	await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id));
}

export type ApiKeyListItem = Omit<ApiKeyRow, 'hashedKey'>;

export async function listApiKeys(): Promise<ApiKeyListItem[]> {
	const rows = await db
		.select({
			id: apiKeys.id,
			label: apiKeys.label,
			prefix: apiKeys.prefix,
			scopes: apiKeys.scopes,
			createdAt: apiKeys.createdAt,
			lastUsedAt: apiKeys.lastUsedAt,
			revokedAt: apiKeys.revokedAt
		})
		.from(apiKeys)
		.orderBy(desc(apiKeys.createdAt));
	return rows as ApiKeyListItem[];
}
