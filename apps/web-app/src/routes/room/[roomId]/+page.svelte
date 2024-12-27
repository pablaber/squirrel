<script lang="ts">
	import { createCryptoUtils } from '$lib/utils';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { ChatRoom, AccessDenied, PasswordRequired } from '$lib/components';
	import { browser } from '$app/environment';
	import { userKeys } from '$lib/state.svelte';

	let cryptoUtils: ReturnType<typeof createCryptoUtils>;
	if (browser) {
		cryptoUtils = createCryptoUtils(crypto.subtle);
	}

	const { data } = $props();
	const roomId = $page.params.roomId;

	const { room: roomData, passwordRequired: passwordRequiredData } = data;

	let mainUserKeys = $derived(userKeys.main);
	let partnerPublicKey = $state<CryptoKey | null>(null);
	let room = $state(roomData);
	let passwordRequired = $state(passwordRequiredData);

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
		if (!mainUserKeys) return 'loading';
		if (room.ownerFingerprint === mainUserKeys.publicKeyFingerprint)
			return 'owner';
		if (!room.guestFingerprint) return 'new-guest';
		if (room.guestFingerprint === mainUserKeys.publicKeyFingerprint)
			return 'guest';
		return 'not-authorized';
	});

	$inspect(roomState);

	let isAuthorized = $derived(roomState === 'owner' || roomState === 'guest');

	/**
	 * Imports the partner's public key if it has not already been imported.
	 */
	async function importPartnerPublicKey() {
		if (room === null) {
			console.warn('Attempting to load keys with null room');
			return;
		}

		if (partnerPublicKey || !room.guestPublicKey) return;

		if (roomState === 'owner') {
			partnerPublicKey = await cryptoUtils.importKey(room.guestPublicKey);
		} else if (roomState === 'guest') {
			partnerPublicKey = await cryptoUtils.importKey(room.ownerPublicKey);
		}
	}

	async function joinRoom() {
		if (!mainUserKeys) return;

		const publicKeyBase64Jwk = await cryptoUtils.exportKey(
			mainUserKeys.publicKey
		);
		const response = await fetch(`/api/room/${roomId}/join`, {
			method: 'POST',
			headers: {
				ContentType: 'application/json'
			},
			body: JSON.stringify({ publicKey: publicKeyBase64Jwk })
		});
		const data = await response.json();
		room = data.room;
		passwordRequired = data.passwordRequired;
	}

	onMount(importPartnerPublicKey);

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
{:else if isAuthorized && mainUserKeys && room}
	<ChatRoom
		{room}
		{partnerPublicKey}
		{isFullRoom}
		ownPrivateKey={mainUserKeys.privateKey}
		fingerprint={mainUserKeys.publicKeyFingerprint}
	/>
{/if}
