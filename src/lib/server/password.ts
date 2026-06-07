import { hash, verify } from '@node-rs/argon2';

const opts = {
	memoryCost: 19456,
	timeCost: 2,
	outputLen: 32,
	parallelism: 1
};

export function hashPassword(password: string): Promise<string> {
	return hash(password, opts);
}

export function verifyPassword(stored: string, password: string): Promise<boolean> {
	return verify(stored, password, opts);
}

export function generateUserId(): string {
	const bytes = new Uint8Array(15);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
