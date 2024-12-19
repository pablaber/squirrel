<script lang="ts">
	import type { Snippet } from 'svelte';
	let { children }: { children: Snippet } = $props();
</script>

<div class="card w-96 bg-neutral text-neutral-content shadow-xl">
	<div class="card-body">
		{@render children()}
	</div>
</div>
