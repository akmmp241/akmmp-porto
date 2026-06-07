<script lang="ts">
	/**
	 * Enhances a server-rendered prose container by injecting:
	 *   - "Copy" buttons on every <pre><code> block
	 *   - Language badges showing the detected shiki language
	 *
	 * Pure client enhancement — server output stays static, scriptless markup.
	 */
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { target }: { target: HTMLElement | undefined } = $props();

	onMount(() => {
		if (!browser || !target) return;
		const cleanups: Array<() => void> = [];

		const pres = target.querySelectorAll<HTMLPreElement>('pre');
		for (const pre of pres) {
			if (pre.dataset.enhanced) continue;
			pre.dataset.enhanced = 'true';
			pre.classList.add('group');
			pre.style.position = 'relative';

			const code = pre.querySelector<HTMLElement>('code');
			const lang =
				(code?.className.match(/language-(\S+)/)?.[1] ?? pre.dataset.language ?? '').replace(
					/^text$/,
					''
				);

			if (lang) {
				const badge = document.createElement('span');
				badge.textContent = lang;
				badge.className =
					'absolute right-12 top-2 rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground';
				pre.appendChild(badge);
			}

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.setAttribute('aria-label', 'Copy code');
			btn.className =
				'absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground opacity-0 transition-all hover:text-foreground group-hover:opacity-100 focus-visible:opacity-100';
			btn.innerHTML =
				'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

			const onClick = async () => {
				try {
					const text = code?.innerText ?? pre.innerText ?? '';
					await navigator.clipboard.writeText(text);
					btn.innerHTML =
						'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
					btn.classList.add('text-emerald-500');
					setTimeout(() => {
						btn.innerHTML =
							'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
						btn.classList.remove('text-emerald-500');
					}, 2000);
				} catch {
					// clipboard blocked — silently ignore
				}
			};
			btn.addEventListener('click', onClick);
			pre.appendChild(btn);
			cleanups.push(() => btn.removeEventListener('click', onClick));
		}

		return () => {
			for (const c of cleanups) c();
		};
	});
</script>
