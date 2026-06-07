<script lang="ts">
	import { Upload, X, Loader2, Image as ImageIcon, AlertCircle } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';

	let {
		value = $bindable(''),
		name = 'image'
	}: { value?: string; name?: string } = $props();

	let dragOver = $state(false);
	let uploading = $state(false);
	let progress = $state(0);
	let error = $state<string | null>(null);

	function bytes(n: number) {
		if (n > 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
		return Math.round(n / 1024) + ' KB';
	}

	async function upload(file: File) {
		error = null;
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
			error = 'Only JPG / PNG / WebP allowed';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			error = 'Max 2MB';
			return;
		}

		uploading = true;
		progress = 0;
		try {
			const xhr = new XMLHttpRequest();
			const fd = new FormData();
			fd.append('file', file);

			const result = await new Promise<{ url: string }>((resolve, reject) => {
				xhr.open('POST', '/admin/api/upload');
				xhr.upload.onprogress = (e) => {
					if (e.lengthComputable) progress = Math.round((e.loaded / e.total) * 100);
				};
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							resolve(JSON.parse(xhr.responseText));
						} catch {
							reject(new Error('Bad response'));
						}
					} else {
						reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
					}
				};
				xhr.onerror = () => reject(new Error('Network error'));
				xhr.send(fd);
			});
			value = result.url;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
			progress = 0;
		}
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) upload(file);
	}

	function onPick(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (file) upload(file);
		input.value = '';
	}

	function clear() {
		value = '';
		error = null;
	}
</script>

<input type="hidden" {name} bind:value />

<div
	role="region"
	aria-label="Project image upload"
	ondragenter={(e) => {
		e.preventDefault();
		dragOver = true;
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (dragOver = false)}
	ondrop={onDrop}
	class={cn(
		'relative grid place-items-center rounded-xl border-2 border-dashed bg-card/40 p-6 transition-all',
		dragOver
			? 'scale-[1.01] border-primary bg-primary/5 shadow-lg'
			: 'border-border hover:border-primary/40'
	)}
>
	{#if value}
		<div class="flex w-full flex-col items-center gap-3">
			<div class="relative">
				<img
					src={value}
					alt="Preview"
					class="max-h-64 rounded-lg object-cover ring-1 ring-border"
				/>
				{#if uploading}
					<div class="absolute inset-0 grid place-items-center rounded-lg bg-black/50">
						<svg class="h-12 w-12" viewBox="0 0 36 36">
							<circle
								cx="18"
								cy="18"
								r="16"
								fill="none"
								class="stroke-white/20"
								stroke-width="3"
							/>
							<circle
								cx="18"
								cy="18"
								r="16"
								fill="none"
								class="stroke-primary"
								stroke-width="3"
								stroke-dasharray={`${progress * 1.005} 100.5`}
								stroke-linecap="round"
								transform="rotate(-90 18 18)"
							/>
						</svg>
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<label
					class="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-xs hover:bg-accent"
				>
					<Upload class="h-3.5 w-3.5" />
					Replace
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						class="hidden"
						onchange={onPick}
					/>
				</label>
				<button
					type="button"
					onclick={clear}
					class="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
				>
					<X class="h-3.5 w-3.5" /> Remove
				</button>
			</div>
		</div>
	{:else}
		<label
			class="flex w-full cursor-pointer flex-col items-center gap-3 py-6 text-center"
		>
			<div
				class={cn(
					'grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform',
					dragOver && 'scale-110'
				)}
			>
				{#if uploading}
					<Loader2 class="h-6 w-6 animate-spin" />
				{:else}
					<ImageIcon class="h-6 w-6" />
				{/if}
			</div>
			<div class="flex flex-col gap-0.5">
				<p class="text-sm font-medium">
					{#if uploading}
						Uploading {progress}%…
					{:else if dragOver}
						Drop to upload
					{:else}
						<span class="text-primary underline-offset-4 hover:underline">Click to upload</span> or drag and drop
					{/if}
				</p>
				<p class="text-xs text-muted-foreground">JPG, PNG, WebP — max 2MB</p>
			</div>
			<input
				type="file"
				accept="image/jpeg,image/png,image/webp"
				class="hidden"
				onchange={onPick}
				disabled={uploading}
			/>
		</label>
	{/if}
</div>

{#if error}
	<p class="mt-2 inline-flex items-center gap-1 text-xs text-destructive">
		<AlertCircle class="h-3.5 w-3.5" />
		{error}
	</p>
{/if}
