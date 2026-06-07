<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { Eye, EyeOff, Loader2, LogIn, Lock, Mail } from '@lucide/svelte';
	import type { PageData } from './$types';
	import { cn } from '$lib/utils/cn';

	let { data }: { data: PageData } = $props();

	const { form, errors, message, enhance, submitting, delayed } = superForm(data.form, {
		resetForm: false
	});

	let showPw = $state(false);
	let shake = $state(false);

	$effect(() => {
		if ($message) {
			shake = false;
			// next tick → trigger animation
			requestAnimationFrame(() => (shake = true));
			const t = setTimeout(() => (shake = false), 600);
			return () => clearTimeout(t);
		}
	});
</script>

<svelte:head>
	<title>Sign in — Admin</title>
</svelte:head>

<div class="grid min-h-screen place-items-center px-4">
	<div
		class={cn(
			'w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 shadow-2xl backdrop-blur-md',
			shake && 'shake'
		)}
	>
		<div class="mb-8 flex flex-col items-center gap-2">
			<div
				class="grid h-12 w-12 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30"
			>
				<Lock class="h-6 w-6" />
			</div>
			<h1 class="text-xl font-semibold">Sign in</h1>
			<p class="text-center text-sm text-muted-foreground">
				Admin access only. Sessions last 30 days.
			</p>
		</div>

		{#if $message}
			<div
				role="alert"
				class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
			>
				{$message}
			</div>
		{/if}

		<form method="POST" use:enhance class="flex flex-col gap-5">
			<!-- email -->
			<div class="group relative">
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="email"
					required
					placeholder=" "
					bind:value={$form.email}
					aria-invalid={$errors.email ? 'true' : undefined}
					class={cn(
						'peer h-14 w-full rounded-md border border-input bg-background px-10 pt-3 text-sm outline-none transition-colors',
						'focus:border-primary',
						$errors.email && 'border-destructive'
					)}
				/>
				<Mail
					class="pointer-events-none absolute top-4 left-3 h-4 w-4 text-muted-foreground transition-colors peer-focus:text-primary"
				/>
				<label
					for="email"
					class={cn(
						'pointer-events-none absolute top-4 left-10 origin-left text-sm text-muted-foreground transition-all duration-150',
						'peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary',
						'peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-75'
					)}
				>
					Email
				</label>
				{#if $errors.email}
					<p class="mt-1 text-xs text-destructive">{$errors.email[0]}</p>
				{/if}
			</div>

			<!-- password -->
			<div class="group relative">
				<input
					id="password"
					name="password"
					type={showPw ? 'text' : 'password'}
					autocomplete="current-password"
					required
					placeholder=" "
					bind:value={$form.password}
					aria-invalid={$errors.password ? 'true' : undefined}
					class={cn(
						'peer h-14 w-full rounded-md border border-input bg-background px-10 pt-3 text-sm outline-none transition-colors',
						'focus:border-primary',
						$errors.password && 'border-destructive'
					)}
				/>
				<Lock
					class="pointer-events-none absolute top-4 left-3 h-4 w-4 text-muted-foreground transition-colors peer-focus:text-primary"
				/>
				<button
					type="button"
					tabindex="-1"
					aria-label={showPw ? 'Hide password' : 'Show password'}
					onclick={() => (showPw = !showPw)}
					class="absolute top-4 right-3 text-muted-foreground transition-transform hover:text-foreground active:scale-90"
				>
					{#if showPw}
						<EyeOff class="h-4 w-4" />
					{:else}
						<Eye class="h-4 w-4" />
					{/if}
				</button>
				<label
					for="password"
					class={cn(
						'pointer-events-none absolute top-4 left-10 origin-left text-sm text-muted-foreground transition-all duration-150',
						'peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-primary',
						'peer-[:not(:placeholder-shown)]:-translate-y-3 peer-[:not(:placeholder-shown)]:scale-75'
					)}
				>
					Password
				</label>
				{#if $errors.password}
					<p class="mt-1 text-xs text-destructive">{$errors.password[0]}</p>
				{/if}
			</div>

			<button
				type="submit"
				disabled={$submitting}
				class={cn(
					'group inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-md transition-all',
					'hover:translate-y-[-1px] hover:shadow-lg active:translate-y-0',
					'disabled:cursor-wait disabled:opacity-80'
				)}
			>
				{#if $delayed || $submitting}
					<Loader2 class="h-4 w-4 animate-spin" />
					<span>Signing in…</span>
				{:else}
					<LogIn class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
					<span>Sign in</span>
				{/if}
			</button>
		</form>
	</div>
</div>

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20%,
		60% {
			transform: translateX(-6px);
		}
		40%,
		80% {
			transform: translateX(6px);
		}
	}
	.shake {
		animation: shake 0.5s var(--ease-out-cubic);
	}
</style>
