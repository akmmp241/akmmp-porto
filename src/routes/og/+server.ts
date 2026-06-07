/**
 * Dynamic OG image endpoint.
 *
 * /og?title=...&subtitle=...&kind=blog|project|page
 *
 * Uses sharp to rasterize an SVG composition into a 1200x630 PNG.
 * Cached aggressively at the edge.
 */
import type { RequestHandler } from './$types';
import sharp from 'sharp';
import { loadSite } from '$lib/server/content';

const WIDTH = 1200;
const HEIGHT = 630;

const escape = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');

/** Rough word-wrap by character count — good enough for OG titles. */
function wrap(text: string, maxChars: number, maxLines: number): string[] {
	const words = text.split(/\s+/);
	const lines: string[] = [];
	let current = '';
	for (const w of words) {
		const next = current ? `${current} ${w}` : w;
		if (next.length > maxChars && current) {
			lines.push(current);
			current = w;
			if (lines.length === maxLines - 1) break;
		} else {
			current = next;
		}
	}
	if (current && lines.length < maxLines) lines.push(current);
	if (lines.length === maxLines && words.length > lines.join(' ').split(/\s+/).length) {
		lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, '…');
	}
	return lines;
}

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const title = (url.searchParams.get('title') ?? '').slice(0, 200) || 'Akmal MP';
	const subtitle = (url.searchParams.get('subtitle') ?? '').slice(0, 200);
	const kind = url.searchParams.get('kind') ?? 'page';

	const site = await loadSite();
	const owner = site.owner;

	const titleLines = wrap(title, 26, 3);
	const titleStartY = 230 + (3 - titleLines.length) * 40;

	const kindLabel =
		kind === 'blog' ? 'BLOG POST' : kind === 'project' ? 'PROJECT' : 'PORTFOLIO';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a1d23" />
      <stop offset="100%" stop-color="#282c33" />
    </linearGradient>
    <radialGradient id="glow" cx="20%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#c778dd" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#c778dd" stop-opacity="0" />
    </radialGradient>
    <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1" fill="#abb2bf" fill-opacity="0.08" />
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)" />
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)" />

  <rect x="60" y="60" width="${WIDTH - 120}" height="${HEIGHT - 120}" fill="none" stroke="#c778dd" stroke-opacity="0.25" stroke-width="2" rx="20" />

  <text x="100" y="160" font-family="'Fira Code', monospace" font-size="22" font-weight="500" fill="#c778dd" letter-spacing="4">
    ${escape(kindLabel)}
  </text>

  ${titleLines
		.map(
			(line, i) =>
				`<text x="100" y="${titleStartY + i * 80}" font-family="'Fira Code', system-ui, sans-serif" font-size="68" font-weight="700" fill="#ffffff">${escape(line)}</text>`
		)
		.join('\n  ')}

  ${
		subtitle
			? `<text x="100" y="${HEIGHT - 130}" font-family="'Fira Code', system-ui, sans-serif" font-size="26" fill="#abb2bf">${escape(subtitle.slice(0, 80))}</text>`
			: ''
	}

  <line x1="100" y1="${HEIGHT - 90}" x2="${WIDTH - 100}" y2="${HEIGHT - 90}" stroke="#abb2bf" stroke-opacity="0.2" stroke-width="1" />

  <text x="100" y="${HEIGHT - 50}" font-family="'Fira Code', monospace" font-size="22" font-weight="600" fill="#ffffff">
    ${escape(owner)}
  </text>
  <text x="${WIDTH - 100}" y="${HEIGHT - 50}" text-anchor="end" font-family="'Fira Code', monospace" font-size="20" fill="#c778dd">
    ${escape(site.baseUrl.replace(/^https?:\/\//, ''))}
  </text>
</svg>`;

	const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();

	setHeaders({
		'Content-Type': 'image/png',
		'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
	});

	return new Response(new Uint8Array(png));
};
