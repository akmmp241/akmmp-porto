<script lang="ts">
	import { Mail, ArrowUp, ArrowRight } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import Linkedin from '$lib/components/ui/icons/linkedin.svelte';
	import Instagram from '$lib/components/ui/icons/instagram.svelte';
	import Discord from '$lib/components/ui/icons/discord.svelte';
	import Link from '$lib/components/ui/link.svelte';
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

	function scrollToTop() {
		if (browser) {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<footer class="mt-32 relative w-full overflow-hidden bg-background">
	<!-- Gradient Top Border Divider -->
	<div class="relative w-full h-[1px]">
		<div class="absolute inset-0 bg-gradient-to-r from-transparent via-border to-transparent opacity-60"></div>
		<div class="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"></div>
	</div>

	<!-- Main Footer Container -->
	<div class="m-auto max-w-5xl px-6 py-16 lg:px-0">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
			<!-- Col 1: Brand & Status -->
			<div class="flex flex-col gap-4 md:col-span-1">
				<a href="/" class="group inline-flex items-center gap-1.5 focus-visible:outline-none">
					<span class="text-xl font-bold tracking-tight text-foreground transition-all duration-300 group-hover:text-primary">
						&lt;Akmalmp /&gt;
					</span>
				</a>
				<p class="text-sm leading-relaxed text-muted-foreground">
					{m.footer_role()}
				</p>
				<!-- Availability badge -->
				<div class="mt-2 flex items-center gap-2">
					<div class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
					</div>
					<span class="text-xs font-medium text-muted-foreground select-none">
						{m.hero_opportunities()}
					</span>
				</div>
			</div>

			<!-- Col 2: Navigation Links -->
			<div class="flex flex-col gap-3">
				<h3 class="text-xs font-semibold tracking-wider text-foreground uppercase">
					{m.footer_nav_title()}
				</h3>
				<ul class="flex flex-col gap-2 text-sm">
					<li>
						<Link href="/" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_home()}
						</Link>
					</li>
					<li>
						<Link href="/projects" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_projects()}
						</Link>
					</li>
					<li>
						<Link href="/blog" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_blog()}
						</Link>
					</li>
					<li>
						<Link href="/about" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_about()}
						</Link>
					</li>
					<li>
						<Link href="/guestbook" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_guestbook()}
						</Link>
					</li>
					<li>
						<Link href="/contact" class="text-muted-foreground hover:text-primary transition-colors duration-200">
							{m.home_nav_contacts()}
						</Link>
					</li>
				</ul>
			</div>

			<!-- Col 3: Social Badges -->
			<div class="flex flex-col gap-4">
				<h3 class="text-xs font-semibold tracking-wider text-foreground uppercase">
					{m.footer_connect_title()}
				</h3>
				<div class="flex flex-wrap gap-2.5">
					{#each about.socials as social (social.platform)}
						{@const Icon = platformIcons[social.platform]}
						{#if Icon}
							<a
								href={social.url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={social.platform}
								class="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/50 text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all duration-300 hover:scale-105"
							>
								<Icon size={20} />
							</a>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Col 4: Guestbook Quick CTA -->
			<div class="flex flex-col gap-4">
				<h3 class="text-xs font-semibold tracking-wider text-foreground uppercase">
					{m.footer_guestbook_title()}
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					{m.footer_guestbook_cta_desc()}
				</p>
				<div>
					<Link
						href="/guestbook"
						class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-border hover:border-primary rounded-lg bg-card/30 hover:bg-primary/5 text-foreground hover:text-primary transition-all duration-300 group"
					>
						<span>{m.footer_guestbook_cta_btn()}</span>
						<ArrowRight size={14} class="transition-transform duration-300 group-hover:translate-x-1" />
					</Link>
				</div>
			</div>
		</div>

		<!-- Footer Bottom Divider -->
		<div class="mt-16 w-full h-[1px] bg-border/40"></div>

		<!-- Bottom Copyright & Scroll To Top -->
		<div class="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
			<p>
				&copy; {new Date().getFullYear()} {m.footer_credit()}
			</p>
			<button
				type="button"
				onclick={scrollToTop}
				class="inline-flex items-center gap-2 cursor-pointer hover:text-primary transition-colors duration-200 group focus-visible:outline-none"
			>
				<span>{m.footer_back_to_top()}</span>
				<ArrowUp size={14} class="transition-transform duration-300 group-hover:-translate-y-0.5" />
			</button>
		</div>
	</div>
</footer>
