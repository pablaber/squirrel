<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Key, Alert } from '$lib/components/svg';

	let password = $state('');
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (errorMessage) {
			const timeout = setTimeout(() => {
				errorMessage = null;
			}, 3000);
			return () => clearTimeout(timeout);
		}
	});

	const {
		roomId,
		onPasswordSubmit
	}: { roomId: string; onPasswordSubmit: () => Promise<void> } = $props();

	async function submitPassword() {
		errorMessage = null;
		const response = await fetch(`/api/room/${roomId}/password`, {
			method: 'POST',
			body: JSON.stringify({ password })
		});
		password = '';
		if (response.ok) {
			return onPasswordSubmit();
		}
		const responseJson = await response.json();
		errorMessage = responseJson.error || 'Something bad happened.';
	}

	function detectEnterKey(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			return submitPassword();
		}
	}
</script>

<div class="flex h-screen flex-col items-center justify-center">
	{#if errorMessage}
		<div class="h-20" in:fade out:fade></div>
	{/if}
	<div class="card w-96 bg-neutral shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-neutral-content">Password Required</h2>
			<p class="text-neutral-content">
				Please enter the password to access this room.
			</p>
			<label class="input input-bordered flex items-center gap-2">
				<Key />
				<input
					type="password"
					placeholder="Room Password"
					onkeypress={detectEnterKey}
					class="grow"
					bind:value={password}
				/>
			</label>
			<button class="btn btn-primary mt-2" onclick={submitPassword}
				>Submit</button
			>
		</div>
	</div>
	{#if errorMessage}
		<div in:fade out:fade class="h-20">
			<div role="alert" class="alert alert-error mt-2">
				<Alert />
				<span>{errorMessage}</span>
			</div>
		</div>
	{/if}
</div>
