<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import { goto } from '$app/navigation';
	import StartCard from './StartCard.svelte';

	let { disabled }: { disabled: boolean } = $props();

	let roomId = $state('');
</script>

<StartCard>
	<h2 class="card-title">Join Existing Room</h2>
	<p>Enter a room ID to join an existing room!</p>
	<div class="card-actions mt-4 flex-shrink justify-start">
		<input
			bind:value={roomId}
			type="text"
			placeholder="Room ID"
			class="input input-bordered w-full"
		/>
		<button
			onclick={() => goto(`/room/${roomId}`)}
			disabled={roomId.length === 0 || disabled}
			class="btn btn-primary">Join Room</button
		>
	</div>
</StartCard>
