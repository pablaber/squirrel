<script lang="ts">
	import { onMount } from 'svelte';
  import { createCryptoUtils, generalUtils, storageUtils} from '$lib/utils';
	import { ids } from '@squirrel/core';

	let keyPair = $state<CryptoKeyPair | null>(null);
	let publicKeyBase64Jwk = $state<string | null>(null);
	
	let newRoomId = $state(ids.generateRoomId());

	onMount(async () => {
		const cryptoUtils = createCryptoUtils(crypto.subtle);
		keyPair = await storageUtils.loadOrCreateKeyPair();
		publicKeyBase64Jwk = await cryptoUtils.exportKey(keyPair.publicKey);
	});
</script>

<div>
	<h1 class="text-2xl font-bold">Welcome to the start page</h1>
	<p class="text-sm text-gray-500">Choose what you want to do:</p>
	<!-- Contain this in a div that is at least 20px from the screen and at most 500px wide -->
	<div class="flex justify-center">
		<div class="max-w-[500px]">
			<form method="POST" action="?/create">
				<input
					type="text"
					name="password"
					placeholder="password (optional)"
					required={false}
					class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input type="text" hidden aria-hidden={true} value={publicKeyBase64Jwk} name="publicKey" required/>
				<input type="text" hidden aria-hidden={true} value={newRoomId} name="newRoomId" required/>
				<button
					type="submit"
					disabled={!publicKeyBase64Jwk}
					class="mt-2 w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
				>
					Create Room
				</button>
			</form>
		</div>
	</div>
</div>
