<script lang="ts">
	import { onMount } from 'svelte';
	import { Hermes } from '$lib/clients';
	import { createCryptoUtils, generalUtils } from '$lib/utils';
	import type { types } from '@squirrel/db';
	import { WsMessage } from '@squirrel/core/messages';
	import { browser } from '$app/environment';

	import { svg } from '$lib/components';
	import ChatMessage from './ChatMessage.svelte';
	import type { RoomMessage } from './types';
	import { fade } from 'svelte/transition';

	const TOAST_DURATION = 2000;

	let cryptoUtils: ReturnType<typeof createCryptoUtils>;
	if (browser) {
		cryptoUtils = createCryptoUtils(crypto.subtle);
	}

	type ChatRoomProps = {
		room: types.RoomWithMessages;
		ownPrivateKey: CryptoKey;
		partnerPublicKey: CryptoKey | null;
		fingerprint: string;
	};
	let {
		room,
		ownPrivateKey,
		partnerPublicKey: partnerPublicKeyProp,
		fingerprint
	}: ChatRoomProps = $props();

	let role = $derived(
		room.ownerFingerprint === fingerprint ? 'owner' : 'guest'
	);

	$inspect(room);

	let hermes: Hermes = $state(new Hermes({ roomId: room.id, fingerprint }));
	let connected = $state(false);
	let currentMessage = $state('');
	let messages = $state<RoomMessage[]>([]);
	let partnerPublicKey: CryptoKey | null = $state(partnerPublicKeyProp);
	let showToast = $state(false);

	$effect(() => {
		if (showToast) {
			const timeout = setTimeout(() => {
				showToast = false;
			}, TOAST_DURATION);
			return () => clearTimeout(timeout);
		}
	});

	$effect(() => {
		if (partnerPublicKey) return;
		fetchPartnerPublicKey();
	});

	let messageContainer: HTMLDivElement;
	$effect(() => {
		console.log('effect', messages.length);
		if (messageContainer && messages.length) {
			console.log('effect', messages.length);
			messageContainer.scrollTop = messageContainer.scrollHeight;
		}
	});

	async function fetchPartnerPublicKey() {
		const response = await fetch(`/api/room/${room.id}`);
		const data = (await response.json()) as { room: types.RoomWithMessages };

		const publicKeyString =
			role === 'owner' ? data.room.guestPublicKey : data.room.ownerPublicKey;
		if (!publicKeyString) return;
		partnerPublicKey = await cryptoUtils.importKey(publicKeyString);
		return loadAndDecryptMessages(partnerPublicKey);
	}

	async function loadAndDecryptMessages(publicKey: CryptoKey) {
		// If there is a partner public key, lets decrypt existing messages in the DB
		const decryptedMessagesPromises = room.messages?.map(async (message) => {
			if (!partnerPublicKey) return null;
			const decryptedContent = await cryptoUtils.decryptMessage(
				message.content,
				ownPrivateKey,
				publicKey
			);
			if (!decryptedContent) return null;
			return {
				...message,
				type: 'client',
				content: decryptedContent,
				ts: new Date(message.ts)
			} as RoomMessage;
		});
		let decryptedMessages: (RoomMessage | null)[] = [];
		if (decryptedMessagesPromises) {
			decryptedMessages = await Promise.all(decryptedMessagesPromises);
		}

		messages = decryptedMessages.filter(
			(message): message is RoomMessage => message !== null
		);
	}

	async function addToMessages(message: WsMessage) {
		let finalContent: string | null = message.content;
		if (message.isClientMessage()) {
			if (!partnerPublicKey) {
				console.error(
					'Attempting to add message to messages array before partner public key is set. This should never happen.'
				);
				return;
			}
			finalContent = await cryptoUtils.decryptMessage(
				message.content,
				ownPrivateKey,
				partnerPublicKey
			);
			if (!finalContent) return;
		}

		messages.push({
			id: message.id,
			sender: message.sender,
			type: message.type,
			content: finalContent,
			ts: message.ts
		});

		if (!partnerPublicKey && message.isServerMessage()) {
			await fetchPartnerPublicKey();
		}
	}

	onMount(async () => {
		// Connect to the hermes websocket
		await hermes.connect();
		connected = true;

		hermes.onMessage((message, error) => {
			if (error || !message) {
				console.error(
					'Error receiving message',
					error?.toJSON() || message?.toWebSocketString()
				);
			} else {
				addToMessages(message);
			}
		});
	});

	function copyRoomLink() {
		navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
		showToast = true;
	}

	function detectEnter(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			return sendMessage();
		}
	}

	async function sendMessage() {
		if (!hermes.connected) {
			console.error('Hermes is not connected, cannot send message');
			return;
		}

		if (!partnerPublicKey) {
			console.error('Partner public key is not set, cannot send message');
			return;
		}

		const encryptedContent = await cryptoUtils.encryptMessage(
			currentMessage,
			partnerPublicKey,
			ownPrivateKey
		);
		hermes.sendMessage(encryptedContent);
		currentMessage = '';
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<div class="relative flex h-full w-full max-w-[1000px] flex-col px-5 py-5">
		<!-- New header -->
		<div class="w-full bg-base-100 pb-5">
			<h2 class="text-center text-xl font-bold">room {room.id}</h2>
		</div>

		{#if !partnerPublicKey}
			<div class="flex flex-1 flex-col items-center justify-center">
				<span class="text-center text-lg font-bold">Waiting for partner...</span>
				<img
					src="/assets/squirrel-waiting.png"
					alt="Loading"
					class="w-72 rounded-lg my-5"
				/>
				<button class="btn btn-primary" onclick={copyRoomLink}>
					<svg.Link size={24} />
					<span>copy room link</span>
				</button>
			</div>
		{/if}

		{#if partnerPublicKey}
			<div
				class="no-scrollbar flex-1 overflow-y-auto"
				bind:this={messageContainer}
			>
				<div class="flex flex-col justify-end gap-2 overflow-y-auto">
					{#each messages as message}
						<ChatMessage {message} {fingerprint} />
					{/each}
				</div>
			</div>
		{/if}

		<div class="w-full shrink-0 bg-base-100 pt-5">
			<input
				type="text"
				disabled={!partnerPublicKey}
				placeholder={!partnerPublicKey
					? 'Waiting for partner...'
					: 'Type a message...'}
				onkeypress={detectEnter}
				bind:value={currentMessage}
				class="input input-bordered w-full"
			/>
		</div>
	</div>
</div>

{#if showToast}
	<div in:fade out:fade class="toast toast-bottom toast-center mb-16">
		<div class="alert alert-success">
			<span>Room link copied to clipboard.</span>
		</div>
	</div>
{/if}
