<script lang="ts">
	import { onMount } from 'svelte';
	import { Hermes } from '$lib/clients';
  import { createCryptoUtils, generalUtils } from '$lib/utils';
  import type { types } from '@squirrel/db';
	import { browser } from '$app/environment';

  let cryptoUtils: ReturnType<typeof createCryptoUtils>;
  if (browser) {
    cryptoUtils = createCryptoUtils(crypto.subtle);
  }

	type Room = types.RoomWithMessages;
  type Message = types.Message;

	type ChatRoomProps = {
		room: Room;
		ownPrivateKey: CryptoKey;
		partnerPublicKey: CryptoKey;
		fingerprint: string;
	};
	let { room, ownPrivateKey, partnerPublicKey, fingerprint }: ChatRoomProps = $props();

	let role = $derived(room.ownerFingerprint === fingerprint ? 'owner' : 'guest');

	let hermes: Hermes = $state(new Hermes({ roomId: room.id, fingerprint }));
	let connected = $state(false);
	let currentMessage = $state('');
	let messages = $state<Message[]>([]);

	async function addToMessages(message: Omit<Message, 'ts'> & { ts: string }) {
    const decryptedContent = await cryptoUtils.decryptMessage(message.content, ownPrivateKey, partnerPublicKey);
    if (!decryptedContent) return;
		messages.push({
			...message,
      content: decryptedContent,
			ts: new Date(message.ts)
		});
	}

	$inspect(hermes);

	onMount(async () => {
    const decryptedMessagesPromises = room.messages?.map(async (message) => {
      const decryptedContent = await cryptoUtils.decryptMessage(message.content, ownPrivateKey, partnerPublicKey);
      if (!decryptedContent) return null;
      return {
        ...message,
        content: decryptedContent,
        ts: new Date(message.ts)
      };
    });
		let decryptedMessages: (Message | null)[] = [];
		if (decryptedMessagesPromises) {
			decryptedMessages = await Promise.all(decryptedMessagesPromises);
		}

    messages = decryptedMessages.filter((message): message is Message => message !== null);

		hermes.connect().then(() => {
			connected = true;
			hermes.onMessage((message, error) => {
				if (error || !message) {
					console.error('Error receiving message', error);
				} else {
					addToMessages(message.message);
				}
			});
		});
	});

  function detectEnter(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      return sendMessage();
    }
  }

	async function sendMessage() {
		if (!hermes.connected) {
			console.error('Socket not connected');
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
		<button onclick={sendMessage} class="rounded-md bg-blue-500 px-4 py-2 text-white">Send</button>
		<div class="flex w-full max-w-[1000px] flex-col justify-center gap-2">
			{#each messages as message}
				<div class="flex flex-row gap-2">
					<span class="font-mono text-gray-500">{`${generalUtils.niceFingerprint(message.sender)}:`}</span>
					<span class="flex-grow">{message.content}</span>
          <span class="font-mono text-gray-500 min-w-[220px] text-right">{message.ts.toLocaleString()}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
