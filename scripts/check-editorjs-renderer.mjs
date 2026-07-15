import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderEditorJS } from '../src/lib/server/editorjs-renderer.ts';

const rendered = await renderEditorJS({
	blocks: [
		{
			type: 'image',
			data: {
				file: { url: '/uploads/blog/test.webp' },
				caption: 'Test image',
				withBorder: true,
				stretched: false,
				withBackground: false
			}
		}
	]
});

assert.match(rendered.html, /<img src="\/uploads\/blog\/test\.webp"/, 'Editor.js image tool data.file.url must render as img src');
assert.match(rendered.html, /<figcaption>Test image<\/figcaption>/, 'Editor.js image caption must render');

const css = readFileSync('src/app.css', 'utf8');
const imageRule = css.match(/\.prose-portfolio img\s*\{[^}]+\}/)?.[0] ?? '';
assert.match(imageRule, /display:\s*block/, 'prose images must render as block elements');
assert.match(imageRule, /max-width:\s*100%/, 'prose images must not overflow the article width');
assert.match(imageRule, /height:\s*auto/, 'prose images must keep aspect ratio');
assert.match(imageRule, /width:\s*100%/, 'prose images should fill the readable column');
assert.match(imageRule, /object-fit:\s*contain/, 'prose images should not crop Editor.js content images');
