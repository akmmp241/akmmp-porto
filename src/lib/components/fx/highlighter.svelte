<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { annotate } from 'rough-notation';
	import type { RoughAnnotation, RoughAnnotationConfig } from 'rough-notation/lib/model';

	type Action = NonNullable<RoughAnnotationConfig['type']>;

	let {
		children,
		action = 'highlight',
		color = '#C778DD',
		strokeWidth = 1.5,
		animationDuration = 600,
		iterations = 2,
		padding = 2,
		multiline = true,
		threshold = 0.85
	}: {
		children: import('svelte').Snippet;
		action?: Action;
		color?: string;
		strokeWidth?: number;
		animationDuration?: number;
		iterations?: number;
		padding?: number;
		multiline?: boolean;
		threshold?: number;
	} = $props();

	let el: HTMLSpanElement;

	onMount(() => {
		if (!browser) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const opts: RoughAnnotationConfig = {
			type: action,
			color,
			strokeWidth,
			animationDuration: reduced ? 0 : animationDuration,
			iterations,
			padding,
			multiline
		};
		const annotation: RoughAnnotation = untrack(() => annotate(el, opts));

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					annotation.show();
					observer.disconnect();
				}
			},
			{ threshold: Math.min(0.99, threshold) }
		);
		observer.observe(el);

		return () => {
			observer.disconnect();
			annotation.remove();
		};
	});
</script>

<span bind:this={el} class="relative inline-block bg-transparent">
	{@render children()}
</span>
