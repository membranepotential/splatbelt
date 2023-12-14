<script lang="ts">
  import { VIEWER_STATE } from '$lib/types'
  import ShotsService from '$lib/services/shots'
  import { controls } from '$lib/stores'

  export let state: VIEWER_STATE

  const speedLevelMap = new Map([
    [0.4, '0.4'],
    [0.7, '0.7'],
    [1, 'x1'],
    [2, 'x2'],
    [4, 'x4'],
  ])

  $: isPlaying = state === VIEWER_STATE.PLAY
  $: shotsNotEmpty = ShotsService.getCurrentShot() !== undefined

  function deleteCurrentShot() {
    ShotsService.deleteCurrentShot()
  }
</script>

<div
  class:open={shotsNotEmpty && isPlaying}
  class="shot-settings-container w-100 flex overflow-hidden"
>
  <div class="duration mr-6 w-10/12 p-4">
    <h5 class="mb-2 font-bold text-indigo-300">Speed</h5>
    <span
      class="isolate inline-flex w-full items-center justify-center rounded-md text-center shadow-sm"
    >
      {#each speedLevelMap as [speed, label]}
        <button
          class:active={speed === $controls.speedFactor}
          type="button"
          on:click={() => ($controls.speedFactor = speed)}
          class="text-md relative inline-flex items-center justify-center rounded-md bg-transparent px-3 py-2 font-semibold text-indigo-300"
        >
          {label}
        </button>
      {/each}
    </span>
  </div>

  <div class=" w-2/12 py-4">
    <h5 class="mb-2 font-bold text-indigo-300">Delete</h5>
    <span class="isolate inline-flex shadow-sm">
      <button
        type="button"
        class="text-md items-cente relative inline-flex bg-slate-200 bg-transparent px-3 py-2 font-semibold text-indigo-900"
        on:click={() => deleteCurrentShot()}
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
            d="M8.99219 13H11.9922H14.9922"
            stroke="white"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          /><path
            d="M3.03919 4.2939C3.01449 4.10866 3.0791 3.92338 3.23133 3.81499C3.9272 3.31953 6.3142 2 12 2C17.6858 2 20.0728 3.31952 20.7687 3.81499C20.9209 3.92338 20.9855 4.10866 20.9608 4.2939L19.2616 17.0378C19.0968 18.2744 18.3644 19.3632 17.2813 19.9821L16.9614 20.1649C13.8871 21.9217 10.1129 21.9217 7.03861 20.1649L6.71873 19.9821C5.6356 19.3632 4.90325 18.2744 4.73838 17.0378L3.03919 4.2939Z"
            stroke="white"
            stroke-width="1.5"
          /><path
            d="M3 5C5.57143 7.66666 18.4286 7.66662 21 5"
            stroke="white"
            stroke-width="1.5"
          /></svg
        ></button
      >
    </span>
  </div>
</div>

<style lang="sass">
.shot-settings-container
  position: absolute
  top: 100vh
  width: 100%
  height: 12vh
  @apply bg-slate-950
  transition: all 400ms ease
  &.open
    transform: translateY(-12vh)
  button
    width: 50px
    &.active
      @apply bg-slate-200 text-indigo-700

</style>
