export type LangCode = 'en' | 'id';

/** Pick the locale-aware text from a Translatable. */
export function tr(value: { en: string; id: string }, lang: LangCode): string {
	return value[lang] ?? value.en;
}

/** Build a locale-aware path. en is bare, id gets a /id prefix. */
export function localePath(path: string, lang: LangCode): string {
	const clean = path.startsWith('/') ? path : `/${path}`;
	if (lang === 'id') {
		return clean === '/' ? '/id' : `/id${clean}`;
	}
	return clean;
}
