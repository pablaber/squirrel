<script lang="ts">
	let { form } = $props();
</script>

<div class="flex h-screen flex-col items-center justify-center">
  <div class="h-10"></div>
	<h1 class="text-2xl font-bold">Enter your master password</h1>
	<form class="sq-form" method="POST">
		<input type="password" name="password" />
		<button type="submit">Submit</button>
	</form>
	<div class="flex h-10 flex-col items-center justify-center">
		{#if form?.message}
			<p class="text-red-500">{form.message}</p>
		{/if}
	</div>
</div>
