<script lang="ts">
  import { createCryptoUtils, storageUtils } from '$lib/utils';
	import { onMount } from 'svelte';
	import ChatRoom from '$lib/components/ChatRoom.svelte';
	import { browser } from '$app/environment';

  let cryptoUtils: ReturnType<typeof createCryptoUtils>;
	if (browser) {
		cryptoUtils = createCryptoUtils(crypto.subtle);
	}

	const { data } = $props();

	const { room: roomData, passwordRequired } = data;

	let keyPair = $state<CryptoKeyPair | null>(null);
	let partnerPublicKey = $state<CryptoKey | null>(null);
	let fingerprint = $state<string | null>(null);
	let room = $state(roomData);


	type RoomRoles = 'owner' | 'guest' | 'new-guest' | 'loading' | 'not-authorized';
	function derivedRole(): RoomRoles {
		if (!keyPair || !fingerprint) return 'loading';

		if (room.ownerFingerprint === fingerprint) {
			return 'owner';
		}

		if (!room.guestFingerprint) {
			return 'new-guest';
		}

		if (room.guestFingerprint === fingerprint) {
			return 'guest';
		}

		return 'not-authorized';
	}
	let role = $derived(derivedRole());

	$inspect(role);

	async function importPartnerPublicKey() {
		if (partnerPublicKey === null && room.guestPublicKey) {
			if (role === 'owner') {
				partnerPublicKey = await cryptoUtils.importKey(room.guestPublicKey);
			} else if (role === 'guest') {
				partnerPublicKey = await cryptoUtils.importKey(room.ownerPublicKey);
			}
		}
	}

	$effect(() => {
		importPartnerPublicKey();
	});

	onMount(async () => {
		keyPair = await storageUtils.loadOrCreateKeyPair();
		fingerprint = await cryptoUtils.calculateFingerprint(keyPair.publicKey);
		await importPartnerPublicKey();
	});

	$effect(() => {
		async function joinRoom() {
			if (!keyPair) return;
			const publicKey = await cryptoUtils.exportKey(keyPair.publicKey);
			const response = await fetch(`/api/room/${room.id}/join`, {
				method: 'POST',
				headers: {
					ContentType: 'application/json'
				},
				body: JSON.stringify({ publicKey })
			});
			const data = await response.json();
			room = data.room;
		}

		if (role === 'new-guest') {
			joinRoom();
		}
	});
</script>

<div>
	<h1>Room {data.room.id}</h1>
	<p>Password required: {data.passwordRequired ? 'Yes' : 'No'}</p>
</div>

{#if role === 'owner' || role === 'guest'}
	{#if keyPair && partnerPublicKey && fingerprint}
		<ChatRoom
			{room}
			ownPrivateKey={keyPair.privateKey}
			partnerPublicKey={partnerPublicKey}
			{fingerprint}
		/>
	{/if}
{/if}
