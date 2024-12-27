<script lang="ts">
	import { NewRoom, JoinRoom } from '$lib/components';
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<h1 class="sq-squirrel-logo my-5 text-5xl">Squirrel</h1>
	<div class="flex flex-col gap-5">
		<NewRoom />
		<JoinRoom />
	</div>
</div>
