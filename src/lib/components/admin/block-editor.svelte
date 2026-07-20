<script lang="ts">
	import { onMount } from 'svelte';
	import type EditorJS from '@editorjs/editorjs';
	import type { OutputData } from '@editorjs/editorjs';

	interface Props {
		value?: string;
		uploadEndpoint: string;
		readonly?: boolean;
	}

	let { value = $bindable(''), uploadEndpoint, readonly = false }: Props = $props();

	let editorContainer: HTMLDivElement;
	let editor: EditorJS | null = null;
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let errorMessage = $state('');

	function parseEditorData(serialized: string): OutputData {
		if (!serialized) return { blocks: [] };

		const data = JSON.parse(serialized) as OutputData;
		if (!Array.isArray(data.blocks)) throw new Error('Invalid editor data');
		return data;
	}

	async function saveEditorValue() {
		if (!editor) return;
		value = JSON.stringify(await editor.save());
	}

	export async function flush() {
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = null;
		await saveEditorValue();
	}

	async function initializeEditor() {
		status = 'loading';
		errorMessage = '';

		try {
			const [EditorJS, Header, List, CodeTool, ImageTool, Quote, Embed, Delimiter, DragDrop, CalloutTool] =
				await Promise.all([
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

			const initialData = parseEditorData(value);
			editor = new EditorJS({
				holder: editorContainer,
				data: initialData,
				placeholder: 'Start writing... Type / for blocks.',
				tools: {
					header: {
						class: Header,
						config: {
							placeholder: 'Heading',
							levels: [2, 3, 4],
							defaultLevel: 2
						}
					},
					list: { class: List, inlineToolbar: true },
					code: CodeTool,
					image: {
						class: ImageTool,
						config: {
							uploader: {
								uploadByFile: async (file: File) => {
									const formData = new FormData();
									formData.append('image', file);
									const response = await fetch(uploadEndpoint, { method: 'POST', body: formData });
									if (!response.ok) {
										errorMessage = 'Image upload failed. Try again.';
										throw new Error('Upload failed');
									}
									return response.json();
								}
							}
						}
					},
					quote: { class: Quote, inlineToolbar: true },
					embed: {
						class: Embed,
						config: { services: { youtube: true, codepen: true, github: true } }
					},
					delimiter: Delimiter,
					callout: CalloutTool
				},
				onChange: () => {
					if (debounceTimer) clearTimeout(debounceTimer);
					debounceTimer = setTimeout(() => {
						void saveEditorValue();
					}, 300);
				}
			});

			await editor.isReady;
			new DragDrop(editor);
			status = 'ready';
		} catch {
			editor?.destroy();
			editor = null;
			status = 'error';
			errorMessage = value ? 'Body data could not load.' : 'Editor could not load.';
		}
	}

	function retry() {
		void initializeEditor();
	}

	onMount(() => {
		if (!readonly) void initializeEditor();
		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
			debounceTimer = null;
			editor?.destroy();
			editor = null;
		};
	});
</script>

{#if readonly}
	<div class="editor-shell editor-legacy" role="status">
		<p>Legacy body preserved. Edit body after converting it to EditorJS.</p>
	</div>
{:else}
	<div class="editor-shell" role="group" aria-labelledby="body-label" aria-busy={status === 'loading'}>
		{#if status === 'loading'}
			<div class="editor-status text-muted-foreground">Loading editor...</div>
		{:else if status === 'error'}
			<div class="editor-status" role="alert">
				<p>{errorMessage}</p>
				<button type="button" onclick={retry}>Retry editor</button>
			</div>
		{/if}
		<div bind:this={editorContainer} class:editor-hidden={status !== 'ready'} class="editor-container"></div>
	</div>

	{#if errorMessage && status === 'ready'}
		<p class="mt-2 text-xs text-destructive" role="alert">{errorMessage}</p>
	{/if}
{/if}

<style>
	.editor-shell {
		position: relative;
		min-height: 400px;
		border: 1px solid var(--color-input);
		border-radius: 0.5rem;
		background: color-mix(in oklab, var(--color-card) 82%, var(--color-background));
		box-shadow: inset 0 1px 0 color-mix(in oklab, var(--color-foreground) 6%, transparent);
		transition: border-color var(--dur-fast) var(--ease-out-cubic);
	}

	.editor-shell:focus-within {
		border-color: var(--color-primary);
	}

	.editor-container {
		min-height: 398px;
		padding: 1rem;
		color: var(--color-foreground);
		font-family: 'Inter', system-ui, sans-serif;
	}

	.editor-hidden {
		visibility: hidden;
	}

	.editor-status {
		position: absolute;
		inset: 0;
		display: grid;
		min-height: 398px;
		place-content: center;
		gap: 0.75rem;
		padding: 1rem;
		font-size: 0.875rem;
		text-align: center;
	}

	.editor-status p {
		margin: 0;
	}

	.editor-status button {
		justify-self: center;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		padding: 0.5rem 0.75rem;
		background: var(--color-accent);
		color: var(--color-accent-foreground);
		font: inherit;
		cursor: pointer;
	}

	:global(.ce-block__content),
	:global(.ce-toolbar__content) {
		max-width: 760px;
	}

	:global(.ce-paragraph),
	:global(.ce-header),
	:global(.ce-quote__text),
	:global(.ce-quote__caption) {
		color: var(--color-foreground);
		font-family: 'Inter', system-ui, sans-serif;
	}

	:global(.ce-paragraph) {
		font-size: 1rem;
		line-height: 1.65;
	}

	:global(.ce-header) {
		line-height: 1.25;
	}

	:global(.ce-code__textarea) {
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-foreground);
		font-family: var(--font-mono);
	}

	:global(.ce-toolbar__plus),
	:global(.ce-toolbar__settings-btn) {
		border-radius: 0.375rem;
		color: var(--color-muted-foreground);
	}

	:global(.ce-toolbar__plus:hover),
	:global(.ce-toolbar__settings-btn:hover),
	:global(.ce-popover-item:hover),
	:global(.ce-popover-item--focused),
	:global(.ce-toolbox__button:hover) {
		background: var(--color-accent);
		color: var(--color-accent-foreground);
	}

	:global(.ce-popover),
	:global(.ce-popover__container),
	:global(.ce-inline-toolbar),
	:global(.ce-conversion-toolbar),
	:global(.ce-toolbox) {
		--color-background: var(--color-popover);
		--color-text-primary: var(--color-popover-foreground);
		--color-text-secondary: var(--color-muted-foreground);
		--color-text-icon-active: var(--color-primary);
		--color-background-icon-active: color-mix(in oklab, var(--color-primary) 18%, transparent);
		--color-background-item-focus: color-mix(in oklab, var(--color-primary) 16%, transparent);
		--color-background-item-hover: var(--color-accent);
		--color-border: color-mix(in oklab, var(--color-foreground) 18%, transparent);
		--color-shadow: color-mix(in oklab, var(--color-background) 70%, transparent);
		border: 1px solid var(--color-border) !important;
		background: var(--color-popover) !important;
		color: var(--color-popover-foreground) !important;
		box-shadow: 0 12px 28px color-mix(in oklab, var(--color-background) 70%, transparent) !important;
	}

	:global(.ce-popover__search),
	:global(.ce-popover__search-input) {
		border-color: var(--color-input) !important;
		background: var(--color-background) !important;
		color: var(--color-foreground) !important;
	}

	:global(.ce-popover__search-input::placeholder) {
		color: var(--color-muted-foreground) !important;
		opacity: 1;
	}

	:global(.ce-popover-item),
	:global(.ce-toolbox__button),
	:global(.ce-popover-item__title),
	:global(.ce-popover-item__icon) {
		color: var(--color-popover-foreground) !important;
		opacity: 1 !important;
	}

	:global(.ce-popover-item__icon svg),
	:global(.ce-popover-item__icon svg path),
	:global(.ce-toolbox__button svg),
	:global(.ce-toolbox__button svg path) {
		fill: currentColor !important;
		stroke: currentColor !important;
	}

	:global(.ce-popover-item--disabled),
	:global(.ce-popover-item--disabled .ce-popover-item__title),
	:global(.ce-popover-item--disabled .ce-popover-item__icon) {
		color: var(--color-muted-foreground) !important;
		opacity: 0.65 !important;
	}

	:global(.ce-popover-item__title),
	:global(.ce-popover-item__icon),
	:global(.ce-toolbar__plus svg),
	:global(.ce-toolbar__settings-btn svg) {
		color: currentColor;
	}

	:global(.ce-inline-tool),
	:global(.ce-conversion-tool) {
		color: var(--color-popover-foreground);
	}

	:global(.ce-inline-tool:hover),
	:global(.ce-inline-tool--active),
	:global(.ce-conversion-tool:hover) {
		background: var(--color-accent);
		color: var(--color-accent-foreground);
	}

	:global(.cdx-callout-wrapper) {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border-radius: 0.375rem;
		border-left: 4px solid var(--color-primary);
		background: var(--color-accent);
		color: var(--color-accent-foreground);
	}

	:global(.cdx-callout-variant),
	:global(.cdx-callout-text) {
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: var(--color-background);
		color: var(--color-foreground);
	}

	:global(.cdx-callout-variant) {
		width: fit-content;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}

	:global(.cdx-callout-text) {
		width: 100%;
		min-height: 80px;
		padding: 0.5rem;
		resize: vertical;
		font: inherit;
		font-size: 0.9375rem;
	}
</style>
