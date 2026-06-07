<script lang="ts">
	import { cn } from '$lib/utils/cn';

	let {
		images = [],
		size = 400,
		class: cls = ''
	}: { images?: string[]; size?: number; class?: string } = $props();

	type RingDef = { r: number; duration: number; reverse: boolean; iconSize: number };

	const RINGS: RingDef[] = [
		{ r: 0,    duration: 0,  reverse: false, iconSize: 48 }, // centre (no orbit)
		{ r: 0.28, duration: 24, reverse: false, iconSize: 36 }, // inner ring
		{ r: 0.46, duration: 38, reverse: true,  iconSize: 28 }  // outer ring
	];

	// How many icons go in each ring (excluding centre which always gets 1)
	const RING_SLOTS = [1, 6, 11];

	type PlacedIcon = {
		src: string;
		ringIdx: number;
		slotIdx: number;   // slot within the ring (for angle calc)
		totalSlots: number;// total slots in this ring
	};

	const placed: PlacedIcon[] = $derived.by(() => {
		const result: PlacedIcon[] = [];
		let imgCursor = 0;
		for (let ri = 0; ri < RINGS.length; ri++) {
			const slots = RING_SLOTS[ri];
			for (let si = 0; si < slots; si++) {
				if (imgCursor >= images.length && ri > 0) break;
				result.push({
					src: images[imgCursor % Math.max(images.length, 1)] ?? '',
					ringIdx: ri,
					slotIdx: si,
					totalSlots: slots
				});
				imgCursor++;
			}
		}
		return result;
	});

	const centre = $derived(size / 2);

	function iconStyle(icon: PlacedIcon): string {
		const ring = RINGS[icon.ringIdx];
		const rx = centre * ring.r; // orbit radius in px
		const half = ring.iconSize / 2;
		const angleDeg = icon.totalSlots > 1 ? (360 / icon.totalSlots) * icon.slotIdx : 0;
		const angleRad = (angleDeg * Math.PI) / 180;

		// Place icon by Cartesian coords relative to centre
		const x = centre + rx * Math.sin(angleRad) - half;
		const y = centre - rx * Math.cos(angleRad) - half;

		if (ring.duration === 0) {
			// Centre icon — no animation
			return `width:${ring.iconSize}px;height:${ring.iconSize}px;top:${y}px;left:${x}px;`;
		}

		// Orbiting icon: rotate around centre, counter-rotate self to stay upright
		const delay = -((angleDeg / 360) * ring.duration);
		const dir = ring.reverse ? 'reverse' : 'normal';
		return [
			`width:${ring.iconSize}px`,
			`height:${ring.iconSize}px`,
			`top:${y}px`,
			`left:${x}px`,
			`transform-origin: ${centre - x + half}px ${centre - y + half}px`,
			`animation: orbit-cw ${ring.duration}s linear ${delay}s infinite ${dir}`
		].join(';');
	}
</script>

<!--
  Pure CSS orbit animation — zero canvas, zero requestAnimationFrame.
  Each icon is absolutely positioned and rotates around the centre point
  using transform-origin set to the cloud centre. Counter-rotation keeps
  the icon image upright.
  GPU-composited (transform only) → smooth with zero JS runtime cost.
-->
<div
	class={cn('icon-cloud', cls)}
	style="width:{size}px;height:{size}px;"
	aria-label="Technology skills orbit"
	role="img"
>
	<!-- Decorative orbit tracks -->
	{#each RINGS.slice(1) as ring, i (i)}
		<div
			class="orbit-track"
			style="
				width:{centre * ring.r * 2}px;
				height:{centre * ring.r * 2}px;
				top:{centre - centre * ring.r}px;
				left:{centre - centre * ring.r}px;
			"
		></div>
	{/each}

	<!-- Icons -->
	{#each placed as icon, idx (idx)}
		{@const ring = RINGS[icon.ringIdx]}
		<div
			class={ring.duration === 0 ? 'icon-wrap icon-centre' : 'icon-wrap icon-orbit'}
			style={iconStyle(icon)}
		>
			{#if icon.src}
				<img
					src={icon.src}
					alt=""
					width={ring.iconSize}
					height={ring.iconSize}
					loading="lazy"
					class="icon-img"
				/>
			{/if}
		</div>
	{/each}
</div>

<style>
	.icon-cloud {
		position: relative;
		flex-shrink: 0;
	}

	.orbit-track {
		position: absolute;
		border-radius: 50%;
		border: 1px solid oklch(0.5 0 0 / 0.1);
		pointer-events: none;
	}

	.icon-wrap {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-img {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: contain;
		padding: 4px;
		background: oklch(0.5 0 0 / 0.06);
		transition: transform 200ms ease, filter 200ms ease;
		filter: drop-shadow(0 1px 3px oklch(0 0 0 / 0.15));
		/* Counter-rotate the image so it stays upright while the wrapper orbits */
		animation: inherit;
		animation-direction: reverse;
	}

	/* Centre icon styling */
	.icon-centre .icon-img {
		background: oklch(0.65 0.12 295 / 0.08);
		border: 1.5px solid oklch(0.65 0.12 295 / 0.25);
		filter: drop-shadow(0 2px 8px oklch(0.65 0.12 295 / 0.2));
		animation: none;
	}

	.icon-img:hover {
		transform: scale(1.2);
		filter: drop-shadow(0 2px 8px oklch(0.65 0.12 295 / 0.4));
	}

	/* Pause on hover */
	.icon-cloud:hover .icon-orbit {
		animation-play-state: paused;
	}
	.icon-cloud:hover .icon-orbit .icon-img {
		animation-play-state: paused;
	}

	@keyframes orbit-cw {
		to { transform: rotate(360deg); }
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-orbit,
		.icon-orbit .icon-img {
			animation: none !important;
		}
	}
</style>
