<script>
  import { page } from '$app/stores'

  /**
   * Refresh but clear querystring
   */
  function hardReload() {
    const url = location.origin + location.pathname
    location.href = url
  }
</script>

<svelte:head>
  <title>Error</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-12">
  <div class="flex flex-col items-center justify-center px-20">
    <h1 class="text-xl">{$page.status}: {$page.error?.message}</h1>
    <button
      class="my-8 bg-white px-4 py-2 text-indigo-700"
      on:click={hardReload}>Reload</button
    >
  </div>
</div>
