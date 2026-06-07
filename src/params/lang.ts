import type { ParamMatcher } from '@sveltejs/kit';

// Only `id` appears in the URL. `en` is the default and lives at root paths.
export const match: ParamMatcher = (param) => param === 'id';
