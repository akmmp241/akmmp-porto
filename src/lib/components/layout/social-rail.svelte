<script lang="ts">
	import { Mail } from '@lucide/svelte';
	import Github from '$lib/components/ui/icons/github.svelte';
	import Linkedin from '$lib/components/ui/icons/linkedin.svelte';
	import Link from '$lib/components/ui/link.svelte';

	const items = [
		{ href: 'https://github.com/akmmp241', label: 'GitHub', icon: Github },
		{ href: 'mailto:akmalmp241@gmail.com', label: 'Email', icon: Mail },
		{ href: 'https://www.linkedin.com/in/akmalmuhammadp/', label: 'LinkedIn', icon: Linkedin }
	];
</script>

<aside
	aria-label="Social links"
	class="fixed top-1/2 left-2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 lg:flex"
>
	<ul class="flex flex-col items-center gap-6">
		{#each items as item (item.label)}
			{@const Icon = item.icon}
			<li>
				<Link href={item.href} aria-label={item.label} class="text-muted-foreground block">
					<Icon size={20} />
				</Link>
			</li>
		{/each}
	</ul>
	<div class="bg-muted-foreground h-32 w-px"></div>
</aside>
