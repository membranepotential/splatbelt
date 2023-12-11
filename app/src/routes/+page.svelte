<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData
</script>

<div class="h-screen w-screen touch-none overflow-y-auto">
  <ul class="list-none divide-y divide-slate-700 text-xl text-indigo-100">
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
  <form method="POST">
    <button
      class="absolute bottom-12 right-12 inline h-20 w-20 rounded-full border-2 border-slate-800 bg-slate-900 text-center align-middle text-xl font-medium text-indigo-100 transition-colors hover:bg-slate-800 hover:text-white focus:bg-slate-800"
    >
      +
    </button>
  </form>
</div>
