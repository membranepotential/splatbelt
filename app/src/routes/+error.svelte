<script>
  import { page } from '$app/stores'
</script>

<svelte:head>
  <title>Error</title>
</svelte:head>

<div class="mx-auto my-4 max-w-md">
  <h1>{$page.status}: {$page.error?.message}</h1>
</div>
