<script lang="ts">
	import { onMount } from 'svelte';
	import { createCryptoUtils, storageUtils } from '$lib/utils';
	import { NewRoom, JoinRoom } from '$lib/components';

	let keyPair = $state<CryptoKeyPair | null>(null);
	let publicKeyBase64Jwk = $state<string | null>(null);
	let loadedKeys = $derived(keyPair !== null && publicKeyBase64Jwk !== null);

	onMount(async () => {
		const cryptoUtils = createCryptoUtils(crypto.subtle);
		keyPair = await storageUtils.loadOrCreateKeyPair();
		publicKeyBase64Jwk = await cryptoUtils.exportKey(keyPair.publicKey);
	});
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1 class="sq-squirrel-logo my-5 text-5xl">Squirrel</h1>
	<div class="flex flex-col gap-5">
		<NewRoom {publicKeyBase64Jwk} />
		<JoinRoom disabled={!loadedKeys} />
	</div>
</div>
