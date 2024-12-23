<script lang="ts">
	import { goto } from '$app/navigation';

	function goBackHome() {
		goto('/');
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<img
		src="/assets/squirrel-smiling.jpg"
		alt="Access denied"
		class="my-5 w-96 rounded-lg"
	/>
	<h2 class="text-center text-xl font-bold text-error">Access Denied</h2>
	<p class="text-center text-lg">You are not authorized to access this room.</p>
	<button class="btn btn-primary mt-2" onclick={goBackHome}> Go Back </button>
</div>
