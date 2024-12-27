<script lang="ts">
	import '../app.css';
	let { children } = $props();
	import '$lib/state.svelte';
	import '@fontsource/pacifico';
</script>

<svelte:head>
	<title>Squirrel</title>
</svelte:head>

<div class="h-screen w-full">
	{@render children()}
</div>
