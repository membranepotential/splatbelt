<script lang="ts">
  import type { Project } from '$lib/schemas'

  export let project: Project

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
    class="inline-flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-slate-800 bg-slate-900 px-6 py-7 text-lg font-medium text-indigo-100 transition-colors transition-colors hover:cursor-pointer hover:text-white"
  >
    <svg
      width="80px"
      height="80px"
      viewBox="0 0 24 24"
      stroke-width="0.8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      color="white"
      ><path
        d="M21 12.353L21 16.647C21 16.8649 20.8819 17.0656 20.6914 17.1715L12.2914 21.8381C12.1102 21.9388 11.8898 21.9388 11.7086 21.8381L3.30861 17.1715C3.11814 17.0656 3 16.8649 3 16.647L2.99998 12.353C2.99998 12.1351 3.11812 11.9344 3.3086 11.8285L11.7086 7.16188C11.8898 7.06121 12.1102 7.06121 12.2914 7.16188L20.6914 11.8285C20.8818 11.9344 21 12.1351 21 12.353Z"
        stroke="white"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      /><path
        d="M3.52844 12.2936L11.7086 16.8382C11.8898 16.9388 12.1102 16.9388 12.2914 16.8382L20.5 12.2778"
        stroke="white"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      /><path
        d="M12 21.5V17"
        stroke="white"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      /><path
        d="M12 12V2M12 2L14.5 4.5M12 2L9.5 4.5"
        stroke="white"
        stroke-width="0.8"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
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
