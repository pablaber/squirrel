<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Squirrel</title>
</svelte:head>

<div class="h-screen w-full">
	{@render children()}
</div>
