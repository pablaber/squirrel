<script lang="ts">
	import { createCryptoUtils, storageUtils } from '$lib/utils';
	import { onMount } from 'svelte';
	import { ChatRoom } from '$lib/components';
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

	type RoomState =
		| 'owner'
		| 'guest'
		| 'new-guest'
		| 'loading'
		| 'not-authorized';

	let roomState: RoomState = $derived.by(() => {
		if (!keyPair || !fingerprint) return 'loading';
		if (room.ownerFingerprint === fingerprint) return 'owner';
		if (!room.guestFingerprint) return 'new-guest';
		if (room.guestFingerprint === fingerprint) return 'guest';
		return 'not-authorized';
	});
	let isAuthorized = $derived(roomState === 'owner' || roomState === 'guest');

	async function importPartnerPublicKey() {
		if (partnerPublicKey === null && room.guestPublicKey) {
			if (roomState === 'owner') {
				partnerPublicKey = await cryptoUtils.importKey(room.guestPublicKey);
			} else if (roomState === 'guest') {
				partnerPublicKey = await cryptoUtils.importKey(room.ownerPublicKey);
			}
		}
	}

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

		if (roomState === 'new-guest') {
			joinRoom();
		} else if (isAuthorized) {
			importPartnerPublicKey();
		}
	});
</script>

{#if isAuthorized && keyPair && fingerprint}
	<ChatRoom
		{room}
		ownPrivateKey={keyPair.privateKey}
		{partnerPublicKey}
		{fingerprint}
	/>
{/if}
