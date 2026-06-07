<script lang="ts">
	import type { PageData } from './$types';
	import ProjectForm from '$lib/components/admin/project-form.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>New project — Admin</title></svelte:head>

<ProjectForm form={data.form} mode="new" />
