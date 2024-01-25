<script lang="ts">
  import UploadIcon from '$lib/icons/upload.svg?raw'
  import ProgressRing from '$lib/components/ProgressRing.svelte'
  import { upload } from '$lib/stores'
  import { goto } from '$app/navigation'

  async function submit(event: Event) {
    const target = event.target as HTMLInputElement
    if (!target.files) return

    const file = target.files[0]
    const id = await upload.start(file)
    goto(`${id}`)
  }
</script>

<div class="flex items-center justify-center bg-slate-950">
  <label
    for="file-input"
    class="text-md inline-flex aspect-square flex-col items-center justify-center gap-2 rounded-full border-2 border-slate-800 bg-slate-900 px-4 py-4 text-indigo-100 transition-colors hover:cursor-pointer hover:text-white"
  >
    {#if $upload === null}
      <span class="h-8 w-8">
        {@html UploadIcon}
      </span>
      Upload Video
    {:else}
      <ProgressRing progress={$upload} />
      {($upload * 100).toFixed(0)}%
    {/if}
  </label>

  <input
    id="file-input"
    type="file"
    accept="video/*"
    class="hidden"
    on:change={submit}
  />
</div>
