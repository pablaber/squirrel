<script lang="ts">
	import { enhance } from '$app/forms';
	import { ids } from '@squirrel/core';
	import StartCard from './StartCard.svelte';
	import { Key } from '../svg';
	let { publicKeyBase64Jwk }: { publicKeyBase64Jwk: string | null } = $props();
	let newRoomId = $state(ids.generateRoomId());
	let showPasswordInput = $state(false);
	let password = $state('');
	function onUsePasswordClick() {
		showPasswordInput = !showPasswordInput;
	}
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
			<button
				type="button"
				class="btn btn-outline btn-primary"
				onclick={onUsePasswordClick}
			>
				{showPasswordInput ? 'Hide Password' : 'Use Password'}
			</button>
			{#if showPasswordInput}
			<label class="input input-bordered flex items-center gap-2 mt-2">
				<Key />
				<input
					type="text"
					value={password}
					name="password"
					placeholder="Room Password"
				/>
			</label>
			{/if}
		</form>
	</div>
</StartCard>
