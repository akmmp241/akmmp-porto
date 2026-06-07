<script lang="ts">
	import type { PageData } from './$types';
	import ExperienceForm from '$lib/components/admin/experience-form.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>Edit {data.experience.title} — Admin</title></svelte:head>

<ExperienceForm form={data.form} mode="edit" experienceId={data.experience.id} />
