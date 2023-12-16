<script lang="ts">
  import { VIEWER_STATE } from '$lib/types'
  import ShotsService from '$lib/services/shots'
  import { controls } from '$lib/stores'
  import { createEventDispatcher } from 'svelte'
  import BucketIcon from '../icons/bucket.svg?raw'

  export let state: VIEWER_STATE

  const speedLevelMap = new Map([
    [0.4, '0.4'],
    [0.7, '0.7'],
    [1, 'x1'],
    [2, 'x2'],
    [4, 'x4'],
  ])

  const dispatch = createEventDispatcher()

  $: isPlaying = state === VIEWER_STATE.PLAY
  $: shotsNotEmpty = ShotsService.getCurrentShot() !== undefined
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
        on:click={() => dispatch('delete')}
      >
        {@html BucketIcon}</button
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
