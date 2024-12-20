<script lang="ts">
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	let { form } = $props();

	let password = $state('');
	let errorMessage = $state(form?.errorMessage);

	$effect(() => {
		if (errorMessage) {
			const timer = setTimeout(() => {
				errorMessage = '';
			}, 3000);
			return () => clearTimeout(timer);
		}
	});

	const redirectTo = $derived(
		new URLSearchParams($page.url.searchParams).get('redirectTo')
	);
</script>

<div class="flex h-screen flex-col items-center justify-center">
	<div class="h-20"></div>

	<div class="card w-96 bg-neutral text-neutral-content shadow-xl">
		<div class="card-body items-center">
			<h1 class="card-title">Site Password</h1>
			<form method="POST">
				<div class="card-actions flex-shrink justify-center">
					<input type="hidden" name="redirectTo" value={redirectTo} />

					<input
						bind:value={password}
						type="password"
						name="password"
						placeholder="password"
						class="input input-bordered w-full"
					/>
					<button
						type="submit"
						disabled={password.length === 0}
						class="btn btn-primary mt-1 px-8"
					>
						Submit
					</button>
				</div>
			</form>
		</div>
	</div>

	<div class="flex h-20 flex-col items-center justify-end">
		{#if errorMessage}
			<div out:fade role="alert" class="alert alert-error">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6 shrink-0 stroke-current"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{`auth failed: ${errorMessage}`}</span>
			</div>
		{/if}
	</div>
</div>
