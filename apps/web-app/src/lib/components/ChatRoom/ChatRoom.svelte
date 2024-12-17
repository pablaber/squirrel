<script lang="ts">
	import { onMount } from 'svelte';
	import { Hermes } from '$lib/clients';
  import { createCryptoUtils, generalUtils } from '$lib/utils';
  import type { types } from '@squirrel/db';
	import { WsMessage } from '@squirrel/core/messages';
	import { browser } from '$app/environment';

	import ChatMessage from './ChatMessage.svelte';
	import type { RoomMessage } from './types';

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
	let { room, ownPrivateKey, partnerPublicKey: partnerPublicKeyProp, fingerprint }: ChatRoomProps = $props();

	let role = $derived(room.ownerFingerprint === fingerprint ? 'owner' : 'guest');

	let hermes: Hermes = $state(new Hermes({ roomId: room.id, fingerprint }));
	let connected = $state(false);
	let currentMessage = $state('');
	let messages = $state<RoomMessage[]>([]);
	let partnerPublicKey: CryptoKey | null = $state(partnerPublicKeyProp);

	$effect(() => {
		if (!partnerPublicKeyProp) return;
		partnerPublicKey = partnerPublicKeyProp;
	})


	async function fetchPartnerPublicKey() {
		const response = await fetch(`/api/room/${room.id}`);
		const data = await response.json() as { room: types.RoomWithMessages };

		const publicKeyString = role === 'owner' ? data.room.guestPublicKey : data.room.ownerPublicKey;
		if (!publicKeyString) return;
		partnerPublicKey = await cryptoUtils.importKey(publicKeyString);
	}

	async function addToMessages(message: WsMessage) {
		let finalContent: string | null = message.content;
		if (message.isClientMessage()) {
			if (!partnerPublicKey) {
				console.error("Attempting to add message to messages array before partner public key is set. This should never happen.");
				return;
		}
			finalContent = await cryptoUtils.decryptMessage(message.content, ownPrivateKey, partnerPublicKey);
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
				console.error('Error receiving message', error?.toJSON() || message?.toWebSocketString());
			} else {
				addToMessages(message);
			}
		});

		// If there is no partner public key, we're waiting for the partner to connect
		if (!partnerPublicKey) return;

		// If there is a partner public key, lets decrypt existing messages in the DB
    const decryptedMessagesPromises = room.messages?.map(async (message) => {
			if (!partnerPublicKey) return null;
      const decryptedContent = await cryptoUtils.decryptMessage(message.content, ownPrivateKey, partnerPublicKey);
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

    messages = decryptedMessages.filter((message): message is RoomMessage => message !== null);
	});

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

    const encryptedContent = await cryptoUtils.encryptMessage(currentMessage, partnerPublicKey, ownPrivateKey);
		hermes.sendMessage(encryptedContent);
		currentMessage = '';
	}
</script>

<div>
	<h1>Chat Room</h1>
	<p>Role: {role}</p>
	<p>Socket Connected: {connected ? 'Yes' : 'No'}</p>
	<p>Room ID: {room.id}</p>
	<p>Fingerprint: {generalUtils.niceFingerprint(fingerprint)}</p>

	<div class="flex flex-col items-center justify-center my-5">
		<input
			type="text"
			onkeypress={detectEnter}
			bind:value={currentMessage}
			class="mb-2 p-1 rounded-md border border-gray-300 w-full max-w-[1000px] mx-20"
		/>
		<button onclick={sendMessage} disabled={!partnerPublicKey} class="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50">
			{!partnerPublicKey ? 'Waiting for partner...' : 'Send'}
		</button>
		<div class="flex w-full max-w-[1000px] flex-col justify-center gap-2">
			{#each messages as message}
				<ChatMessage message={message} />
			{/each}
		</div>
	</div>
</div>
