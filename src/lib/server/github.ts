/**
 * github.ts — GitHub API integration with DB-backed TTL cache.
 *
 * Security:
 *  - GITHUB_TOKEN accessed only via $env/dynamic/private (server-side only)
 *  - TODO(security): Use fine-grained PAT with read-only public repo scope
 *  - On API failure, stale cache is returned with a warning flag
 */
import { env } from '$env/dynamic/private';
import { db } from './db';
import { sql } from 'drizzle-orm';

const GITHUB_USERNAME = 'akmmp241';
const GITHUB_API = 'https://api.github.com';
const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

// ───── Types ──────────────────────────────────────────────────────────────────

export interface GitHubProfile {
	login: string;
	name: string | null;
	avatar_url: string;
	bio: string | null;
	public_repos: number;
	followers: number;
	following: number;
	html_url: string;
	totalStars: number;
}

export interface GitHubRepo {
	name: string;
	full_name: string;
	description: string | null;
	html_url: string;
	stargazers_count: number;
	forks_count: number;
	language: string | null;
	languageColor: string | null;
	topics: string[];
}

export interface ContributionDay {
	date: string;
	contributionCount: number;
	color: string;
}

export interface ContributionWeek {
	contributionDays: ContributionDay[];
}

export interface Contributions {
	totalContributions: number;
	weeks: ContributionWeek[];
}

export interface LanguageStat {
	name: string;
	color: string | null;
	percentage: number;
	bytes: number;
}

export interface GitHubStats {
	profile: GitHubProfile;
	repos: GitHubRepo[];
	contributions: Contributions;
	languages: LanguageStat[];
	stale?: boolean;
}

// ───── Language colors (common subset) ───────────────────────────────────────

const LANGUAGE_COLORS: Record<string, string> = {
	TypeScript: '#3178c6',
	JavaScript: '#f1e05a',
	Python: '#3572A5',
	Go: '#00ADD8',
	Rust: '#dea584',
	PHP: '#4F5D95',
	Java: '#b07219',
	'C#': '#178600',
	'C++': '#f34b7d',
	C: '#555555',
	Swift: '#F05138',
	Kotlin: '#A97BFF',
	Ruby: '#701516',
	Svelte: '#ff3e00',
	Vue: '#41b883',
	HTML: '#e34c26',
	CSS: '#563d7c',
	Shell: '#89e051',
	Dockerfile: '#384d54'
};

// ───── HTTP helpers ───────────────────────────────────────────────────────────

function githubHeaders(): HeadersInit {
	const token = env.GITHUB_TOKEN;
	const headers: HeadersInit = {
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28'
	};
	if (token) {
		(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
	}
	return headers;
}

async function ghFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders() });
	if (!res.ok) {
		throw new Error(`GitHub API error ${res.status}: ${path}`);
	}
	return res.json() as Promise<T>;
}

async function ghGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
	const token = env.GITHUB_TOKEN;
	if (!token) throw new Error('GITHUB_TOKEN is required for GraphQL API');

	const res = await fetch(GITHUB_GRAPHQL, {
		method: 'POST',
		headers: {
			...githubHeaders(),
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query, variables })
	});
	if (!res.ok) throw new Error(`GitHub GraphQL error ${res.status}`);
	const json = (await res.json()) as { data: T; errors?: unknown[] };
	if (json.errors?.length) throw new Error(`GitHub GraphQL errors: ${JSON.stringify(json.errors)}`);
	return json.data;
}

// ───── Cache helpers ──────────────────────────────────────────────────────────

/** Retrieve cached value if not stale. Returns null if missing or expired. */
async function getCachedFresh<T>(key: string): Promise<{ data: T; stale: false } | null> {
	// Use raw SQL for interval arithmetic (fetched_at + ttl > now())
	const rows = await db.execute<{ data: T }>(
		sql`SELECT data FROM github_cache WHERE key = ${key} AND fetched_at + ttl > now() LIMIT 1`
	);

	if (rows.length === 0) return null;
	return { data: rows[0].data as T, stale: false };
}

/** Retrieve stale cache (for fallback when API fails). */
async function getStaleCache<T>(key: string): Promise<T | null> {
	const rows = await db.execute<{ data: T }>(
		sql`SELECT data FROM github_cache WHERE key = ${key} LIMIT 1`
	);
	return rows.length > 0 ? (rows[0].data as T) : null;
}

/** Upsert a cache entry with the given TTL string (e.g. '1 hour', '6 hours'). */
async function setCache<T>(key: string, data: T, ttl: string): Promise<void> {
	await db.execute(
		sql`INSERT INTO github_cache (key, data, fetched_at, ttl)
			VALUES (${key}, ${JSON.stringify(data)}::jsonb, now(), ${ttl}::interval)
			ON CONFLICT (key) DO UPDATE
				SET data = EXCLUDED.data,
					fetched_at = EXCLUDED.fetched_at,
					ttl = EXCLUDED.ttl`
	);
}

// ───── Data Fetchers ──────────────────────────────────────────────────────────

async function fetchProfile(): Promise<GitHubProfile> {
	const [user, repos] = await Promise.all([
		ghFetch<Record<string, unknown>>(`/users/${GITHUB_USERNAME}`),
		ghFetch<{ stargazers_count: number }[]>(
			`/users/${GITHUB_USERNAME}/repos?per_page=100&type=owner`
		)
	]);

	const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count ?? 0), 0);

	return {
		login: user.login as string,
		name: (user.name as string) || null,
		avatar_url: user.avatar_url as string,
		bio: (user.bio as string) || null,
		public_repos: user.public_repos as number,
		followers: user.followers as number,
		following: user.following as number,
		html_url: user.html_url as string,
		totalStars
	};
}

async function fetchRepos(): Promise<GitHubRepo[]> {
	const raw = await ghFetch<Record<string, unknown>[]>(
		`/users/${GITHUB_USERNAME}/repos?per_page=100&sort=stars&type=owner`
	);

	return raw.slice(0, 20).map((r) => ({
		name: r.name as string,
		full_name: r.full_name as string,
		description: (r.description as string) || null,
		html_url: r.html_url as string,
		stargazers_count: (r.stargazers_count as number) ?? 0,
		forks_count: (r.forks_count as number) ?? 0,
		language: (r.language as string) || null,
		languageColor: r.language ? (LANGUAGE_COLORS[r.language as string] ?? '#8b949e') : null,
		topics: (r.topics as string[]) ?? []
	}));
}

async function fetchContributions(): Promise<Contributions> {
	const query = `
		query($login: String!) {
			user(login: $login) {
				contributionsCollection {
					contributionCalendar {
						totalContributions
						weeks {
							contributionDays {
								contributionCount
								date
								color
							}
						}
					}
				}
			}
		}
	`;

	type GQLResponse = {
		user: {
			contributionsCollection: {
				contributionCalendar: {
					totalContributions: number;
					weeks: ContributionWeek[];
				};
			};
		};
	};

	const data = await ghGraphQL<GQLResponse>(query, { login: GITHUB_USERNAME });
	return data.user.contributionsCollection.contributionCalendar;
}

function computeLanguages(repos: GitHubRepo[]): LanguageStat[] {
	const counts: Record<string, number> = {};
	for (const repo of repos) {
		if (repo.language) {
			counts[repo.language] = (counts[repo.language] ?? 0) + 1;
		}
	}
	const total = Object.values(counts).reduce((a, b) => a + b, 0);
	if (total === 0) return [];

	return Object.entries(counts)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 6)
		.map(([name, bytes]) => ({
			name,
			color: LANGUAGE_COLORS[name] ?? '#8b949e',
			percentage: Math.round((bytes / total) * 100),
			bytes
		}));
}

// ───── Public API ─────────────────────────────────────────────────────────────

/**
 * Load all GitHub stats with DB-backed caching.
 * On API failure, returns stale cache with `stale: true`.
 */
export async function getGitHubStats(): Promise<GitHubStats> {
	// Try fresh cache first
	const [cachedProfile, cachedRepos, cachedContribs] = await Promise.all([
		getCachedFresh<GitHubProfile>('profile'),
		getCachedFresh<GitHubRepo[]>('repos'),
		getCachedFresh<Contributions>('contributions')
	]);

	const needsProfile = !cachedProfile;
	const needsRepos = !cachedRepos;
	const needsContribs = !cachedContribs;

	let profile: GitHubProfile | null = cachedProfile?.data ?? null;
	let repos: GitHubRepo[] | null = cachedRepos?.data ?? null;
	let contributions: Contributions | null = cachedContribs?.data ?? null;
	let stale = false;

	// Fetch what's missing
	try {
		const fetches = await Promise.allSettled([
			needsProfile ? fetchProfile() : Promise.resolve(profile!),
			needsRepos ? fetchRepos() : Promise.resolve(repos!),
			needsContribs ? fetchContributions() : Promise.resolve(contributions!)
		]);

		if (fetches[0].status === 'fulfilled') {
			profile = fetches[0].value as GitHubProfile;
			if (needsProfile) await setCache('profile', profile, '6 hours');
		} else {
			console.warn('[github] profile fetch failed:', fetches[0].reason);
			profile = await getStaleCache<GitHubProfile>('profile');
			stale = true;
		}

		if (fetches[1].status === 'fulfilled') {
			repos = fetches[1].value as GitHubRepo[];
			if (needsRepos) await setCache('repos', repos, '1 hour');
		} else {
			console.warn('[github] repos fetch failed:', fetches[1].reason);
			repos = await getStaleCache<GitHubRepo[]>('repos');
			stale = true;
		}

		if (fetches[2].status === 'fulfilled') {
			contributions = fetches[2].value as Contributions;
			if (needsContribs) await setCache('contributions', contributions, '12 hours');
		} else {
			console.warn('[github] contributions fetch failed:', fetches[2].reason);
			contributions = await getStaleCache<Contributions>('contributions');
			stale = true;
		}
	} catch (err) {
		console.error('[github] unexpected error:', err);
		stale = true;
	}

	// Fallback to empty structures if even stale cache is missing
	const safeProfile: GitHubProfile = profile ?? {
		login: GITHUB_USERNAME,
		name: null,
		avatar_url: `https://github.com/${GITHUB_USERNAME}.png`,
		bio: null,
		public_repos: 0,
		followers: 0,
		following: 0,
		html_url: `https://github.com/${GITHUB_USERNAME}`,
		totalStars: 0
	};
	const safeRepos: GitHubRepo[] = repos ?? [];
	const safeContributions: Contributions = contributions ?? {
		totalContributions: 0,
		weeks: []
	};

	const languages = computeLanguages(safeRepos);

	return {
		profile: safeProfile,
		repos: safeRepos,
		contributions: safeContributions,
		languages,
		stale
	};
}
