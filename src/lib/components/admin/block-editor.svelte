<script lang="ts">
import { onMount } from 'svelte';
import type EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';

interface Props {
	value?: string;
	uploadEndpoint: string;
}

let { value = $bindable(''), uploadEndpoint }: Props = $props();

let editorContainer: HTMLDivElement;
let editor: EditorJS | null = null;
let mounted = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

onMount(async () => {
	const [EditorJS, Header, List, CodeTool, ImageTool, Quote, Embed, Delimiter, DragDrop, CalloutTool] = await Promise.all([
		import('@editorjs/editorjs').then((m) => m.default),
		import('@editorjs/header').then((m) => m.default),
		import('@editorjs/list').then((m) => m.default),
		import('@editorjs/code').then((m) => m.default),
		import('@editorjs/image').then((m) => m.default),
		import('@editorjs/quote').then((m) => m.default),
		import('@editorjs/embed').then((m) => m.default),
		import('@editorjs/delimiter').then((m) => m.default),
		import('editorjs-drag-drop').then((m) => m.default),
		import('$lib/components/admin/editorjs-callout-tool').then((m) => m.default)
	]);

	const initialData: OutputData = value ? JSON.parse(value) : { blocks: [] };

	editor = new EditorJS({
		holder: editorContainer,
		data: initialData,
		tools: {
			header: {
				class: Header,
				config: {
					placeholder: 'Heading',
					levels: [2, 3, 4],
					defaultLevel: 2
				}
			},
			list: {
				class: List,
				inlineToolbar: true
			},
			code: CodeTool,
			image: {
				class: ImageTool,
				config: {
					uploader: {
						uploadByFile: async (file: File) => {
							const formData = new FormData();
							formData.append('image', file);
							const res = await fetch(uploadEndpoint, { method: 'POST', body: formData });
							if (!res.ok) throw new Error('Upload failed');
							return res.json();
						}
					}
				}
			},
			quote: {
				class: Quote,
				inlineToolbar: true
			},
			embed: {
				class: Embed,
				config: {
					services: {
						youtube: true,
						codepen: true,
						github: true
					}
				}
			},
			delimiter: Delimiter,
			callout: CalloutTool
		},
		onChange: async () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				if (!editor) return;
				const outputData = await editor.save();
				value = JSON.stringify(outputData);
			}, 300);
		}
	});

	await editor.isReady;
	new DragDrop(editor);
	mounted = true;

	return () => {
		if (editor) editor.destroy();
	};
});

$effect(() => {
	if (!mounted || !editor) return;
	try {
		const newData: OutputData = value ? JSON.parse(value) : { blocks: [] };
		editor.render(newData);
	} catch {
		// ignore parse errors
	}
});
</script>

<div bind:this={editorContainer} class="editor-container"></div>

<style>
	.editor-container {
		border: 1px solid var(--color-input);
		border-radius: 0.5rem;
		padding: 1rem;
		min-height: 400px;
		background: var(--color-background);
		color: var(--color-foreground);
	}

	:global(.cdx-callout-wrapper) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.375rem;
		border-left: 4px solid;
	}

	:global(.cdx-callout-info) {
		background: #eff6ff;
		border-left-color: #3b82f6;
	}

	:global(.cdx-callout-warning) {
		background: #fef3c7;
		border-left-color: #f59e0b;
	}

	:global(.cdx-callout-tip) {
		background: #d1fae5;
		border-left-color: #10b981;
	}

	:global(.cdx-callout-danger) {
		background: #fee2e2;
		border-left-color: #ef4444;
	}

	:global(.cdx-callout-variant) {
		width: fit-content;
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: var(--color-background);
		color: var(--color-foreground);
		font-size: 0.875rem;
	}

	:global(.cdx-callout-text) {
		width: 100%;
		min-height: 80px;
		padding: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		resize: vertical;
		font-family: inherit;
		font-size: 0.9375rem;
		background: var(--color-background);
		color: var(--color-foreground);
	}
</style>
