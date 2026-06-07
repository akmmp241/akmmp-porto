<script lang="ts">
	import Highlighter from '$lib/components/fx/highlighter.svelte';
	import { m } from '$lib/paraglide/messages.js';

	const quote = $derived(m.quote_text() as string);
	const highlight = $derived(m.quote_highlight() as string);

	const segments = $derived.by(() => {
		const parts: { text: string; mark: boolean }[] = [];
		let s = quote;
		const h = highlight;
		while (s.length) {
			const idx = s.indexOf(h);
			if (idx === -1) {
				parts.push({ text: s, mark: false });
				break;
			}
			if (idx > 0) parts.push({ text: s.slice(0, idx), mark: false });
			parts.push({ text: h, mark: true });
			s = s.slice(idx + h.length);
		}
		return parts;
	});
</script>

<section class="px-6 lg:p-0">
	<div class="border border-border/30 bg-card/15 hover:border-primary/30 relative m-auto w-full max-w-4xl rounded-2xl p-8 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-lg hover:shadow-primary/5 group">
		<!-- Glowing corner indicators -->
		<div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -z-10 group-hover:bg-primary/10 transition-colors duration-300"></div>
		<div class="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl -z-10 group-hover:bg-purple-500/10 transition-colors duration-300"></div>

		<span class="text-primary/20 absolute -top-4 left-4 text-6xl font-serif select-none pointer-events-none transition-transform duration-300 group-hover:scale-110">“</span>
		<p class="text-base font-bold md:text-xl leading-relaxed text-foreground/90 pt-2">
			{#each segments as seg, i (i)}
				{#if seg.mark}
					<Highlighter action="underline" color="#C778DD" threshold={0.85}>
						<span class="text-primary">{seg.text}</span>
					</Highlighter>
				{:else}
					{seg.text}
				{/if}
			{/each}
		</p>
		<span class="text-primary/20 absolute -bottom-10 right-4 text-6xl font-serif select-none pointer-events-none transition-transform duration-300 group-hover:scale-110">”</span>
		<p class="text-muted-foreground mt-4 text-right text-sm md:text-base font-medium">
			— <span class="text-foreground/80 font-bold">{m.quote_author()}</span>
		</p>
	</div>
</section>
