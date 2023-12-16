<script lang="ts">
  import UploadIcon from '$lib/icons/upload.svg?raw'
  // import type { Project } from '$lib/schemas'

  // export let project: Project

  let uploadStarted = false

  function start(event: Event) {
    const target = event.target as HTMLInputElement
    const file = target.files![0]

    console.log('start upload', file.name)
  }
</script>

<div
  class:hidden={uploadStarted}
  class="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-slate-950"
>
  <label
    for="file-input"
    class="inline-flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-slate-800 bg-slate-900 px-6 py-7 text-lg font-medium text-indigo-100 transition-colors hover:cursor-pointer hover:text-white"
  >
    {@html UploadIcon}
    Upload a Video
  </label>

  <input
    id="file-input"
    type="file"
    accept="video/*"
    class="hidden"
    on:change={start}
  />
</div>
