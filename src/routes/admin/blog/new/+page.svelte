<script lang="ts">
	import BlogPostForm from '$lib/components/admin/blog-post-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>New post — Admin</title></svelte:head>

<BlogPostForm form={data.form} mode={data.mode} />
