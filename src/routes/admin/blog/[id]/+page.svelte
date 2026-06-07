<script lang="ts">
	import BlogPostForm from '$lib/components/admin/blog-post-form.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit post — Admin</title></svelte:head>

<BlogPostForm form={data.form} mode={data.mode} postId={data.post.id} />
