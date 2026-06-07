<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	/**
	 * Splash screen shown only on the very first visit per session.
	 * Uses sessionStorage so it only fires once per browser tab, not on
	 * every navigation (SvelteKit keeps the layout mounted).
	 *
	 * Timeline:
	 *  0ms   – overlay visible, logo appears
	 *  900ms – logo fully visible, begins hold
	 *  1400ms– overlay starts fade-out
	 *  2000ms– overlay removed from DOM
	 */

	const DURATION_TOTAL = 2000; // ms until DOM removal
	const DURATION_FADE  = 600;  // ms for the fade-out transition

	let visible = $state(false);
	let exiting = $state(false);

	onMount(() => {
		if (!browser) return;
		const seen = sessionStorage.getItem('splash-seen');
		if (seen) return;

		sessionStorage.setItem('splash-seen', '1');
		visible = true;

		// Lock scroll while splash is visible
		document.documentElement.style.overflow = 'hidden';

		let t2: ReturnType<typeof setTimeout>;
		const t = setTimeout(() => {
			exiting = true;
			t2 = setTimeout(() => {
				visible = false;
				document.documentElement.style.overflow = '';
			}, DURATION_FADE);
		}, DURATION_TOTAL - DURATION_FADE);

		// Cleanup both timers on component destroy
		return () => {
			clearTimeout(t);
			clearTimeout(t2);
			document.documentElement.style.overflow = '';
		};
	});
</script>

{#if visible}
	<div
		class="splash"
		class:splash-exit={exiting}
		aria-hidden="true"
		aria-live="off"
	>
		<div class="splash-content">
			<!-- Logo mark -->
			<div class="splash-logo">
				<span class="logo-bracket">[</span>
				<span class="logo-letter">A</span>
				<span class="logo-bracket">]</span>
			</div>

			<!-- Name -->
			<p class="splash-name">Akmalmp</p>

			<!-- Loading bar -->
			<div class="splash-bar-track" aria-hidden="true">
				<div class="splash-bar"></div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* === Overlay === */
	.splash {
		position: fixed;
		inset: 0;
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--background, #282c33);
		/* subtle diagonal pattern */
		background-image:
			repeating-linear-gradient(
				-45deg,
				oklch(1 0 0 / 0.015) 0px,
				oklch(1 0 0 / 0.015) 1px,
				transparent 1px,
				transparent 12px
			);
		transition: opacity var(--splash-fade, 600ms) cubic-bezier(0.4, 0, 0.2, 1);
	}

	.splash-exit {
		opacity: 0;
		pointer-events: none;
	}

	/* === Content wrapper === */
	.splash-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		animation: splash-rise 700ms cubic-bezier(0.33, 1, 0.68, 1) both;
	}

	@keyframes splash-rise {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* === Logo === */
	.splash-logo {
		display: flex;
		align-items: center;
		gap: 2px;
		font-family: var(--font-mono, monospace);
		font-size: 2.5rem;
		font-weight: 800;
		letter-spacing: -0.02em;
		animation: splash-logo-in 800ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both;
	}

	@keyframes splash-logo-in {
		from {
			opacity: 0;
			transform: scale(0.75);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.logo-bracket {
		color: var(--primary, rgb(199, 120, 221));
		opacity: 0.7;
		font-weight: 400;
	}

	.logo-letter {
		color: var(--foreground, #fff);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border: 2px solid var(--primary, rgb(199, 120, 221));
		border-radius: 6px;
		font-size: 1.5rem;
	}

	/* === Name === */
	.splash-name {
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--muted-foreground, rgb(171, 178, 191));
		animation: splash-fade-in 600ms ease 400ms both;
	}

	/* === Loading bar === */
	.splash-bar-track {
		width: 120px;
		height: 2px;
		background: oklch(0.5 0 0 / 0.2);
		border-radius: 999px;
		overflow: hidden;
		animation: splash-fade-in 300ms ease 500ms both;
	}

	.splash-bar {
		height: 100%;
		width: 100%;
		background: var(--primary, rgb(199, 120, 221));
		border-radius: 999px;
		transform-origin: left;
		animation: splash-fill 1200ms cubic-bezier(0.16, 1, 0.3, 1) 200ms both;
	}

	@keyframes splash-fill {
		from { transform: scaleX(0); }
		to   { transform: scaleX(1); }
	}

	@keyframes splash-fade-in {
		from { opacity: 0; }
		to   { opacity: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.splash-content,
		.splash-logo,
		.splash-bar,
		.splash-name,
		.splash-bar-track {
			animation: none !important;
		}
	}
</style>
