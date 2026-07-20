import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const source = readFileSync('src/routes/admin/blog/new/+page.server.ts', 'utf8');
const formSource = readFileSync('src/lib/components/admin/blog-post-form.svelte', 'utf8');
const publicSource = readFileSync('src/routes/blog/[slug]/+page.server.ts', 'utf8');

assert.match(
	formSource,
	/name="contentFormat"/,
	'blog admin form must submit contentFormat so Editor.js content is not saved/rendered as markdown'
);
assert.match(
	formSource,
	/bind:value=\{\$form\.contentFormat\}/,
	'blog admin form contentFormat input must be bound to the superform value'
);
assert.match(
	publicSource,
	/const rawContent: unknown = post\.content/,
	'public blog route must inspect raw JSONB content before locale extraction'
);
assert.match(
	publicSource,
	/if \(isEditorJsContent\(rawContent\)\)/,
	'public blog route must render raw Editor.js JSONB content'
);
assert.match(
	publicSource,
	/if \(isEditorJsContent\(contentStr\)\)/,
	'public blog route must render locale-wrapped Editor.js content'
);
assert.doesNotMatch(
	publicSource,
	/contentFormat === ['"]editorjs['"] \|\|/,
	'public blog route must not trust stale contentFormat over body shape'
);
assert.match(
	publicSource,
	/renderMarkdown\(contentStr\)/,
	'public blog route must render non-Editor.js body as markdown'
);

const valuesStart = source.indexOf('.values({');
assert.notEqual(valuesStart, -1, 'new blog action must insert blog post values');
const returningStart = source.indexOf('})\n\t\t\t.returning()', valuesStart);
assert.notEqual(returningStart, -1, 'new blog action insert values block must be found');
const valuesBlock = source.slice(valuesStart, returningStart);
assert.match(
	valuesBlock,
	/contentFormat:\s*form\.data\.contentFormat/,
	'new blog action must persist contentFormat so Editor.js posts render with renderEditorJS()'
);
