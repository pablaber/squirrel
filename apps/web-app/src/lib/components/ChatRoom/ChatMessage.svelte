<script lang="ts">
	import type { RoomMessage } from './types';
	import '@github/relative-time-element';

	let { message, fingerprint } = $props<{
		message: RoomMessage;
		fingerprint: string;
	}>();
	console.log(message.sender, fingerprint);
</script>

{#if message.type === 'client' && message.sender === fingerprint}
	<div class="chat chat-end">
		<div class="chat-bubble chat-bubble-primary">
			{message.content}
		</div>
		<div class="chat-footer opacity-50">
			<relative-time datetime={message.ts.toISOString()}>
				{message.ts.toLocaleString()}
			</relative-time>
		</div>
	</div>
{:else if message.type === 'client' && message.sender !== fingerprint}
	<div class="chat chat-start">
		<div class="chat-bubble">
			{message.content}
		</div>
		<div class="chat-footer opacity-50">
			<relative-time datetime={message.ts.toISOString()}>
				{message.ts.toLocaleString()}
			</relative-time>
		</div>
	</div>
{:else if message.type === 'server'}
	<span class="text-md my-2 text-center text-gray-500">{message.content}</span>
{:else if message.type === 'error'}
	<span class="text-md my-2text-center text-red-500">{message.content}</span>
{/if}
