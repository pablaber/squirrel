<script lang="ts">
	import type { RoomMessage } from './types';
	import { generalUtils } from '../../utils';

	let { message } = $props<{ message: RoomMessage }>();
</script>

<div class="mx-1 flex h-6 flex-row items-center gap-2">
	{#if message.type === 'client'}
		<span class="font-mono text-gray-500">{`${generalUtils.niceFingerprint(message.sender)}:`}</span
		>
		<span class="flex-grow overflow-hidden">{message.content}</span>
		<span class="min-w-[220px] text-right font-mono text-gray-500"
			>{message.ts.toLocaleString()}</span
		>
	{:else if message.type === 'server'}
		<span class="flex-grow text-center text-sm text-gray-500">{message.content}</span>
	{:else if message.type === 'error'}
		<span class="flex-grow text-center text-sm text-red-500">{message.content}</span>
	{/if}
</div>
