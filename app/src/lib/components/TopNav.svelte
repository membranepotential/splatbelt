<script lang="ts">
  import { page } from '$app/stores'
  import type { Shot } from '$lib/stores/gesture'
  import { VIEWER_STATE } from '$lib/types'

  export let state: VIEWER_STATE
  export let shots: Shot[]

  $: activeIdx = parseInt($page.params?.shotIdx)

  /**
   * TODO: Improve back behavior, e.g.(?):
   *
   * If in play, delete motion and go back to free
   * If in free, delete current, get activeShot -= 1, go back to free
   */
  function handleBack() {}

  $: canGoBack =
    state !== VIEWER_STATE.RECORD && // never when recording
    (state === VIEWER_STATE.PLAY || // always when playing
      (state === VIEWER_STATE.FREE && activeIdx > 0)) // only in free when not in first shot

  /**
   * TODO: When do you export? Can you do it at free or also at play?
   */
  function handleExport() {
    alert('NYI')
  }

  $: canExport = shots.length > 0
</script>

<button
  class="absolute right-2 top-2 rounded-lg bg-slate-900 px-2.5 py-2.5 text-indigo-200 duration-150 hover:bg-slate-950 active:bg-slate-950"
  on:click={handleExport}
  class:hidden={!canExport}
>
  <svg
    width="24px"
    height="24px"
    stroke-width="1.5"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="white"
    ><path
      d="M20 13V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V13"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    /><path
      d="M12 15V3M12 3L8.5 6.5M12 3L15.5 6.5"
      stroke="white"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    /></svg
  >
</button>
<button
  class="absolute left-2 top-2 rounded-lg bg-slate-900 px-2.5 py-2.5 text-indigo-600 duration-150 hover:bg-slate-950 active:bg-slate-950"
  on:click={handleBack}
  class:hidden={!canGoBack}
>
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    color="white"
    stroke-width="1.5"
    ><path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12 1.25C6.06294 1.25 1.25 6.06294 1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25ZM10.9697 16.0303L7.46967 12.5303C7.17678 12.2374 7.17678 11.7626 7.46967 11.4697L10.9697 7.96967C11.2626 7.67678 11.7374 7.67678 12.0303 7.96967C12.3232 8.26256 12.3232 8.73744 12.0303 9.03033L9.81066 11.25H16C16.4142 11.25 16.75 11.5858 16.75 12C16.75 12.4142 16.4142 12.75 16 12.75H9.81066L12.0303 14.9697C12.3232 15.2626 12.3232 15.7374 12.0303 16.0303C11.7374 16.3232 11.2626 16.3232 10.9697 16.0303Z"
      fill="white"
    /></svg
  >
</button>
