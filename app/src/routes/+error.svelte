<script>
  import { page } from '$app/stores'
</script>

<svelte:head>
  <title>Error</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-2">
  <h1>{$page.status}: {$page.error?.message}</h1>
</div>
