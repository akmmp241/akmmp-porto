import path from 'node:path';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import { error } from '@sveltejs/kit';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

// Magic-byte signatures
function detectMime(bytes: Uint8Array): string | null {
	if (bytes.length < 12) return null;
	// JPEG: FF D8 FF
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	// PNG: 89 50 4E 47 0D 0A 1A 0A
	if (
		bytes[0] === 0x89 &&
		bytes[1] === 0x50 &&
		bytes[2] === 0x4e &&
		bytes[3] === 0x47 &&
		bytes[4] === 0x0d &&
		bytes[5] === 0x0a &&
		bytes[6] === 0x1a &&
		bytes[7] === 0x0a
	)
		return 'image/png';
	// WebP: RIFF....WEBP
	if (
		bytes[0] === 0x52 &&
		bytes[1] === 0x49 &&
		bytes[2] === 0x46 &&
		bytes[3] === 0x46 &&
		bytes[8] === 0x57 &&
		bytes[9] === 0x45 &&
		bytes[10] === 0x42 &&
		bytes[11] === 0x50
	)
		return 'image/webp';
	return null;
}

function uuid(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

const UPLOAD_ROOT = path.resolve('static/uploads');
const PROJECTS_DIR = path.join(UPLOAD_ROOT, 'projects');

async function ensureDir() {
	if (!existsSync(PROJECTS_DIR)) {
		await mkdir(PROJECTS_DIR, { recursive: true });
	}
}

export async function saveProjectImage(file: File): Promise<string> {
	if (file.size === 0) throw error(400, 'Empty file');
	if (file.size > MAX_BYTES) throw error(400, 'File too large (max 2MB)');
	if (!ALLOWED_MIME.has(file.type)) throw error(400, 'Invalid file type');

	const buf = new Uint8Array(await file.arrayBuffer());
	const mime = detectMime(buf);
	if (!mime || !ALLOWED_MIME.has(mime)) {
		throw error(400, 'File contents do not match an allowed image format');
	}

	await ensureDir();

	// Re-encode to WebP via sharp → strips metadata + caps dimensions
	const out = await sharp(buf)
		.rotate()
		.resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 82 })
		.toBuffer();

	const filename = `${uuid()}.webp`;
	const fullPath = path.join(PROJECTS_DIR, filename);
	await writeFile(fullPath, out);

	return `/uploads/projects/${filename}`;
}

export async function deleteProjectImage(publicPath: string | null | undefined): Promise<void> {
	if (!publicPath || !publicPath.startsWith('/uploads/projects/')) return;
	const filename = path.basename(publicPath);
	const fullPath = path.join(PROJECTS_DIR, filename);
	try {
		if (existsSync(fullPath)) await unlink(fullPath);
	} catch {
		// best effort
	}
}
