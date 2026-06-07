<script lang="ts">
	import { DropdownMenu as DM } from 'bits-ui';
	import { ChevronDown } from '@lucide/svelte';
	import { cn } from '$lib/utils/cn';
	import { localizeHref, locales, getLocale } from '$lib/paraglide/runtime.js';
	import { page } from '$app/state';

	let { class: cls = '' }: { class?: string } = $props();

	const current = $derived(getLocale());
	const path = $derived(page.url.pathname);
</script>

<DM.Root>
	<DM.Trigger
		class={cn(
			'focus-visible:ring-primary focus-visible:ring-offset-background flex cursor-pointer items-center gap-0.5 font-bold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
			cls
		)}
	>
		{current.toUpperCase()}
		<ChevronDown size={16} />
	</DM.Trigger>
	<DM.Portal>
		<DM.Content
			class="border-muted-foreground bg-background text-foreground z-[1000] min-w-[6rem] overflow-hidden rounded-md border p-0 shadow-md"
			sideOffset={8}
		>
			{#each locales as locale (locale)}
				{#if locale !== current}
					<DM.Item
						class="focus:bg-background focus:text-muted-foreground flex w-full cursor-pointer items-center px-4 py-2 text-sm font-bold focus:outline-none"
					>
						<a href={localizeHref(path, { locale })} class="block w-full" data-sveltekit-reload>
							{locale.toUpperCase()}
						</a>
					</DM.Item>
				{/if}
			{/each}
		</DM.Content>
	</DM.Portal>
</DM.Root>
