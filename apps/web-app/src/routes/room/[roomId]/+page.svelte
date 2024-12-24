<script lang="ts">
	import { createCryptoUtils, storageUtils } from '$lib/utils';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ChatRoom, AccessDenied, PasswordRequired } from '$lib/components';
	import { browser } from '$app/environment';

	let cryptoUtils: ReturnType<typeof createCryptoUtils>;
	if (browser) {
		cryptoUtils = createCryptoUtils(crypto.subtle);
	}

	const { data } = $props();
	const roomId = $page.params.roomId;

	const { room: roomData, passwordRequired } = data;

	let keyPair = $state<CryptoKeyPair | null>(null);
	let partnerPublicKey = $state<CryptoKey | null>(null);
	let fingerprint = $state<string | null>(null);
	let room = $state(roomData);

	let isFullRoom = $derived(!!room?.guestPublicKey && !!room?.ownerPublicKey);

	type RoomState =
		| 'owner'
		| 'guest'
		| 'new-guest'
		| 'loading'
		| 'password-required'
		| 'not-authorized';

	let roomState: RoomState = $derived.by(() => {
		if (room === null || passwordRequired) return 'password-required';
		if (!keyPair || !fingerprint) return 'loading';
		if (room.ownerFingerprint === fingerprint) return 'owner';
		if (!room.guestFingerprint) return 'new-guest';
		if (room.guestFingerprint === fingerprint) return 'guest';
		return 'not-authorized';
	});
	let isAuthorized = $derived(roomState === 'owner' || roomState === 'guest');

	async function importPartnerPublicKey() {
		if (room === null) {
			console.warn('Attempting to load keys with null room');
			return;
		}

		if (partnerPublicKey === null && room.guestPublicKey) {
			if (roomState === 'owner') {
				partnerPublicKey = await cryptoUtils.importKey(room.guestPublicKey);
			} else if (roomState === 'guest') {
				partnerPublicKey = await cryptoUtils.importKey(room.ownerPublicKey);
			}
		}
	}

	async function joinRoom() {
		if (!keyPair) return;
		const publicKey = await cryptoUtils.exportKey(keyPair.publicKey);
		const response = await fetch(`/api/room/${roomId}/join`, {
			method: 'POST',
			headers: {
				ContentType: 'application/json'
			},
			body: JSON.stringify({ publicKey })
		});
		const data = await response.json();
		room = data.room;
	}

	onMount(async () => {
		keyPair = await storageUtils.loadOrCreateKeyPair();
		fingerprint = await cryptoUtils.calculatePublicKeyFingerprint(
			keyPair.publicKey
		);
		await importPartnerPublicKey();
	});

	$effect(() => {
		if (roomState === 'new-guest') {
			joinRoom();
		} else if (isAuthorized) {
			importPartnerPublicKey();
		}
	});
</script>

<svelte:head>
	<title>Squirrel - {roomId}</title>
</svelte:head>

{#if roomState === 'not-authorized'}
	<AccessDenied />
{:else if roomState === 'password-required'}
	<PasswordRequired onPasswordSubmit={joinRoom} {roomId} />
{:else if isAuthorized && keyPair && fingerprint && room}
	<ChatRoom
		{room}
		ownPrivateKey={keyPair.privateKey}
		{partnerPublicKey}
		{fingerprint}
		{isFullRoom}
	/>
{/if}
