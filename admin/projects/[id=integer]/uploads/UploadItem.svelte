<script lang="ts">
  import { onDestroy } from 'svelte'
  import type { UploadStore } from './upload'

  export let upload: UploadStore

  const total = upload.urls.length
  let progress = 0

  const unsubscribe = upload.subscribe((completed) => {
    progress = completed / total
  })

  onDestroy(unsubscribe)
</script>

<span>Uploading: {upload.object.name}</span>

{#if progress < 1.0}
  <span class="ml-2">Upload progress: {Math.round(100 * progress)}%</span>
{/if}
