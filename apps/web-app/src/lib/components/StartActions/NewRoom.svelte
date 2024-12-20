<script lang="ts">
	import { enhance } from '$app/forms';
	import { ids } from '@squirrel/core';
	import StartCard from './StartCard.svelte';
	let { publicKeyBase64Jwk }: { publicKeyBase64Jwk: string | null } = $props();
	let newRoomId = $state(ids.generateRoomId());
</script>

<StartCard>
	<h2 class="card-title">Create New Room</h2>
	<p>Create a new room to start chatting now!</p>
	<div class="card-actions mt-4 flex-shrink justify-start">
		<form method="POST" action="?/create" use:enhance>
			<input
				type="text"
				hidden
				aria-hidden={true}
				name="newRoomId"
				value={newRoomId}
				required
			/>
			<input
				type="text"
				hidden
				aria-hidden={true}
				name="publicKey"
				value={publicKeyBase64Jwk}
				required
			/>
			<button
				type="submit"
				disabled={!publicKeyBase64Jwk}
				class="btn btn-primary">Create Room</button
			>
		</form>
	</div>
</StartCard>
