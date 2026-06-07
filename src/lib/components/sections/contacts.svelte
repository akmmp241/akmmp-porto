<script lang="ts">
	import { Mail, Copy, Check } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import Linkedin from '$lib/components/ui/icons/linkedin.svelte';
	import Instagram from '$lib/components/ui/icons/instagram.svelte';
	import Discord from '$lib/components/ui/icons/discord.svelte';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { about } from '$lib/data/about';
	import { browser } from '$app/environment';

	const platformIcons = {
		github: Github,
		email: Mail,
		linkedin: Linkedin,
		instagram: Instagram,
		discord: Discord
	} as const;

	let copied = $state<string | null>(null);

	async function copy(text: string, key: string) {
		if (!browser) return;
		try {
			await navigator.clipboard.writeText(text);
			copied = key;
			setTimeout(() => {
				if (copied === key) copied = null;
			}, 1500);
		} catch {
			/* clipboard not available */
		}
	}
</script>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.contacts_title()}</SectionHeading>
	<div class="flex flex-col gap-12 md:flex-row">
		<div class="lg:max-w-4/5">
			<p class="text-muted-foreground">{m.contacts_description()}</p>
		</div>
		<div>
			<div class="flex w-72 flex-col gap-4 border p-4">
				<h2 class="font-semibold">{m.contacts_tagline()}</h2>
				<ul class="flex flex-col gap-3">
					{#each about.socials as social (social.platform)}
						{@const Icon = platformIcons[social.platform]}
						<li class="flex items-center justify-between gap-2 text-sm">
							<a
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								class="text-muted-foreground hover:text-foreground flex flex-1 items-center gap-2 transition-colors"
							>
								<Icon size={20} />
								<span class="truncate">{social.label}</span>
							</a>
							<button
								type="button"
								aria-label={copied === social.platform ? m.contacts_copied() : m.contacts_copy()}
								class="text-muted-foreground hover:text-foreground cursor-pointer"
								onclick={() => copy(social.label, social.platform)}
							>
								{#if copied === social.platform}
									<Check size={14} />
								{:else}
									<Copy size={14} />
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>
