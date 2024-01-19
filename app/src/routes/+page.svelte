<script lang="ts">
  import type { PageData } from './$types'
  import Upload from './Upload.svelte'

  export let data: PageData
</script>

<div class="relative h-full touch-none overflow-y-auto sm:mx-auto sm:w-[390px]">
  <ul
    class="h-full list-none divide-y divide-slate-700 text-xl text-indigo-100"
  >
    {#each data.projects as project}
      <li>
        <a
          class="block overflow-x-hidden text-ellipsis whitespace-nowrap px-4 py-6 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-800"
          href={`/${project.id}`}
        >
          {project.name}
        </a>
      </li>
    {/each}
  </ul>
  <div class="absolute bottom-8 right-8">
    <Upload />
  </div>
</div>
