<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { VIEWER_STATE, type Shot } from '$lib/types'
  import BackIcon from '$lib/icons/back.svg?raw'
  import ExportIcon from '$lib/icons/export.svg?raw'

  export let state: VIEWER_STATE
  export let shots: Shot[]

  $: currentShotIndex = parseInt($page.url.searchParams.get('shot') ?? '0')

  /**
   * TODO: Improve back behavior, e.g.(?):
   *
   * If in play, delete motion and go back to free
   * If in free, delete current, get activeShot -= 1, go back to free
   */
  function handleBack() {
    if (state === VIEWER_STATE.PLAY) {
      goto(`?state=FREE&shot=${currentShotIndex}`)
    }
  }

  $: canGoBack =
    state !== VIEWER_STATE.RECORD && // never when recording
    (state === VIEWER_STATE.PLAY || // always when playing
      (state === VIEWER_STATE.FREE && currentShotIndex > 0)) // only in free when not in first shot

  /**
   * TODO: When do you export? Can you do it at free or also at play?
   */
  function handleExport() {
    goto(`?state=EXPORT&shot=0`)
  }

  $: canExport = shots.length > 0
</script>

<button
  class="absolute right-2 top-2 rounded-lg bg-slate-900 px-2.5 py-2.5 text-indigo-200 duration-150 hover:bg-slate-950 active:bg-slate-950"
  on:click={handleExport}
  class:hidden={!canExport}
>
  {@html ExportIcon}
</button>
<button
  class="absolute left-2 top-2 rounded-lg bg-slate-900 px-2.5 py-2.5 text-indigo-600 duration-150 hover:bg-slate-950 active:bg-slate-950"
  on:click={handleBack}
  class:hidden={!canGoBack}
>
  {@html BackIcon}
</button>
