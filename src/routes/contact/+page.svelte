<script lang="ts">
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { contactFormSchema } from '$lib/schemas/engagement';
	import SectionHeading from '$lib/components/layout/section-heading.svelte';
	import Contacts from '$lib/components/sections/contacts.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { Loader2, Check } from '@lucide/svelte';

	let { data } = $props();

	let showSuccess = $state(false);

	const { form, errors, enhance, delayed, message } = superForm(data.form, {
		validators: zodClient(contactFormSchema),
		onUpdated({ form }) {
			if (form.valid) {
				showSuccess = true;
				setTimeout(() => {
					showSuccess = false;
				}, 4000);
			}
		}
	});

	onMount(() => {
		$form._loadedAt = Date.now().toString();
	});

	const charCount = $derived($form.message?.length || 0);
	const charCountColor = $derived(
		charCount >= 2000 ? 'text-destructive font-semibold' : charCount >= 1800 ? 'text-amber-500 font-semibold' : 'text-muted-foreground'
	);
</script>

<svelte:head>
	<title>Contact · Akmal MP</title>
</svelte:head>

<section class="flex flex-col gap-12 px-6 lg:p-0">
	<SectionHeading>{m.contacts_title()}</SectionHeading>
	<p class="text-muted-foreground max-w-2xl">{m.contacts_page_subtitle()}</p>

	<div class="flex flex-col gap-12 lg:flex-row">
		<!-- Contact Form Section -->
		<div class="flex-1 max-w-xl">
			<form method="POST" use:enhance class="flex flex-col gap-6">
				<!-- Honeypot -->
				<div style="position: absolute; left: -9999px;">
					<label for="honeypot">Leave this empty if you are human</label>
					<input type="text" id="honeypot" name="honeypot" bind:value={$form.honeypot} tabindex="-1" autocomplete="off" />
				</div>

				<input type="hidden" name="_loadedAt" bind:value={$form._loadedAt} />

				<!-- Name -->
				<div class="relative z-0 w-full group">
					<input
						type="text"
						name="name"
						id="name"
						bind:value={$form.name}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2.5 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors"
						placeholder=" "
						required
					/>
					<label
						for="name"
						class="peer-focus:font-medium absolute text-sm text-muted-foreground duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary"
					>
						Name
					</label>
					<!-- Accent underline scale expand from center -->
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					{#if $errors.name}
						<span class="text-xs text-destructive mt-1">{$errors.name}</span>
					{/if}
				</div>

				<!-- Email -->
				<div class="relative z-0 w-full group">
					<input
						type="email"
						name="email"
						id="email"
						bind:value={$form.email}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2.5 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors"
						placeholder=" "
						required
					/>
					<label
						for="email"
						class="peer-focus:font-medium absolute text-sm text-muted-foreground duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary"
					>
						Email address
					</label>
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					{#if $errors.email}
						<span class="text-xs text-destructive mt-1">{$errors.email}</span>
					{/if}
				</div>

				<!-- Subject -->
				<div class="relative z-0 w-full group">
					<input
						type="text"
						name="subject"
						id="subject"
						bind:value={$form.subject}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2.5 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors"
						placeholder=" "
					/>
					<label
						for="subject"
						class="peer-focus:font-medium absolute text-sm text-muted-foreground duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary"
					>
						Subject (Optional)
					</label>
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					{#if $errors.subject}
						<span class="text-xs text-destructive mt-1">{$errors.subject}</span>
					{/if}
				</div>

				<!-- Message -->
				<div class="relative z-0 w-full group">
					<textarea
						name="message"
						id="message"
						rows="4"
						bind:value={$form.message}
						class="peer block w-full appearance-none border-b border-border bg-transparent py-2.5 px-0 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-0 transition-colors resize-none"
						placeholder=" "
						required
					></textarea>
					<label
						for="message"
						class="peer-focus:font-medium absolute text-sm text-muted-foreground duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-primary"
					>
						Message
					</label>
					<span class="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-primary transition-transform duration-200 peer-focus:scale-x-100 origin-center"></span>
					<div class="flex justify-between items-center mt-1">
						{#if $errors.message}
							<span class="text-xs text-destructive">{$errors.message}</span>
						{:else}
							<span></span>
						{/if}
						<span class="text-xs {charCountColor}">{charCount} / 2000</span>
					</div>
				</div>

				<!-- Response Messages -->
				{#if $message}
					<div class="p-3 text-sm rounded bg-primary/10 text-primary border border-primary/20">
						{$message}
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={$delayed || showSuccess}
					class="relative overflow-hidden w-full h-11 rounded-md bg-primary text-primary-foreground font-semibold text-sm shadow-md transition-all hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
				>
					{#if $delayed}
						<Loader2 class="h-4 w-4 animate-spin" />
						Sending...
					{:else}
						<!-- Submit Button Morph to Success checkmark -->
						<div class="flex items-center justify-center gap-2 transition-all duration-300 {showSuccess ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}">
							Submit Message
						</div>
						<div class="absolute inset-0 flex items-center justify-center gap-2 bg-emerald-600 text-white transition-all duration-300 {showSuccess ? 'translate-y-0' : 'translate-y-10'}">
							<Check class="h-5 w-5" />
							Sent!
						</div>
					{/if}
				</button>
			</form>
		</div>

		<!-- Info / Socials Block -->
		<div class="lg:w-[320px]">
			<Contacts />
		</div>
	</div>
</section>
