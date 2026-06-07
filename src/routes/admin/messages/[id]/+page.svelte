<script lang="ts">
	import { ArrowLeft, Mail, Archive, Trash2, Calendar, Reply } from '@lucide/svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDate(d: Date | string) {
		return new Date(d).toLocaleDateString(undefined, {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{data.message.subject || 'Message'} — Admin</title>
</svelte:head>

<div class="mb-6">
	<a
		href="/admin/messages"
		class="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
	>
		<ArrowLeft class="h-3.5 w-3.5" /> Back to messages
	</a>
</div>

<div class="flex flex-col gap-6 lg:flex-row">
	<!-- Message Container -->
	<div class="flex-1 rounded-xl border border-border bg-card/40 p-6 backdrop-blur-sm">
		<div class="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
			<div class="flex flex-col gap-1">
				<h1 class="text-xl font-semibold tracking-tight">{data.message.subject || 'No Subject'}</h1>
				<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
					<span>From: <strong class="text-foreground">{data.message.name}</strong> ({data.message.email})</span>
					{#if data.message.ipAddress}
						<span>•</span>
						<span>IP: {data.message.ipAddress}</span>
					{/if}
				</div>
			</div>
			
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<Calendar class="h-4 w-4" />
				{formatDate(data.message.createdAt)}
			</div>
		</div>

		<!-- Message Text content -->
		<div class="py-6 whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed min-h-[150px]">
			{data.message.message}
		</div>

		<!-- Action triggers footer -->
		<div class="border-t border-border pt-6 flex flex-wrap justify-between items-center gap-4">
			<div class="flex items-center gap-3">
				<a
					href={`mailto:${data.message.email}?subject=Re: ${encodeURIComponent(data.message.subject || 'Portfolio Contact')}`}
					class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/95 transition-all cursor-pointer"
				>
					<Reply class="h-4 w-4" /> Reply via Email
				</a>
			</div>

			<div class="flex items-center gap-2">
				{#if !data.message.archived}
					<form method="POST" action="?/archive" class="contents">
						<button
							type="submit"
							class="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer"
						>
							<Archive class="h-3.5 w-3.5" /> Archive Message
						</button>
					</form>
				{/if}

				<form method="POST" action="?/delete" class="contents">
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
						onclick={(e) => { if (!confirm('Are you sure you want to permanently delete this message?')) e.preventDefault(); }}
					>
						<Trash2 class="h-3.5 w-3.5" /> Delete Permanently
					</button>
				</form>
			</div>
		</div>
	</div>
</div>
