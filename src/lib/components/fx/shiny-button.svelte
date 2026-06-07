<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		children,
		class: cls = '',
		onclick,
		...rest
	}: {
		children: import('svelte').Snippet;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		[k: string]: unknown;
	} = $props();
</script>

<button
	{...rest}
	{onclick}
	class={cn(
		'shiny-btn border-primary relative cursor-pointer rounded-lg border px-6 py-2 font-medium tracking-wide uppercase backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow',
		cls
	)}
>
	<span class="shiny-text relative block size-full text-sm">
		{@render children()}
	</span>
</button>

<style>
	.shiny-btn {
		--x: 100%;
		animation: shiny-x 3s linear infinite;
	}
	.shiny-text {
		mask-image: linear-gradient(
			-75deg,
			rgb(255 255 255) calc(var(--x) + 20%),
			transparent calc(var(--x) + 30%),
			rgb(255 255 255) calc(var(--x) + 100%)
		);
		-webkit-mask-image: linear-gradient(
			-75deg,
			rgb(255 255 255) calc(var(--x) + 20%),
			transparent calc(var(--x) + 30%),
			rgb(255 255 255) calc(var(--x) + 100%)
		);
	}
	@keyframes shiny-x {
		0% {
			--x: 100%;
		}
		100% {
			--x: -100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.shiny-btn {
			animation: none;
		}
	}
</style>
