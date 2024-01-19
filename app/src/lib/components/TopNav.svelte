<script lang="ts">
  import BackIcon from '$lib/icons/back.svg?raw'
  import ExportIcon from '$lib/icons/export.svg?raw'
  import { createEventDispatcher } from 'svelte'

  export let showBack = true
  export let showExport = true

  const dispatch = createEventDispatcher<{ back: void; export: void }>()
</script>

<button
  class="absolute right-4 top-4 h-16 w-16 rounded-lg bg-transparent px-2.5 py-2.5 text-indigo-200 duration-150 hover:bg-slate-950 active:bg-slate-950"
  on:click={() => dispatch('export')}
  class:hidden={!showExport}
>
  {@html ExportIcon}
</button>
<button
  class="absolute left-4 top-4 h-16 w-16 rounded-lg bg-transparent px-2.5 py-2.5 text-indigo-600"
  on:click={() => dispatch('back')}
  class:hidden={!showBack}
>
  {@html BackIcon}
</button>
