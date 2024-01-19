<script lang="ts">
  import UploadIcon from '$lib/icons/upload.svg?raw'
  import ProgressRing from '$lib/components/ProgressRing.svelte'
  import { upload } from '$lib/stores'
  import { goto } from '$app/navigation'

  let form: HTMLFormElement

  async function submit(event: Event) {
    const file = (event.target! as HTMLInputElement).files![0]
    const id = await upload.start(file)
    goto(`${id}`)
  }
</script>

<form
  bind:this={form}
  method="POST"
  class="flex items-center justify-center bg-slate-950"
>
  <label
    for="file-input"
    class="inline-flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-slate-800 bg-slate-900 px-6 py-7 text-lg font-medium text-indigo-100 transition-colors hover:cursor-pointer hover:text-white"
  >
    {#if $upload === null}
      {@html UploadIcon}
      Upload a Video
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
</form>
