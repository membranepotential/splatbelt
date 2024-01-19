<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { type Shot, Movement } from '$lib/types'
  import SettingsIcon from '../icons/settings.svg?raw'
  import DollyIcon from '../icons/dolly.svg?raw'
  import ZoomIcon from '../icons/zoom.svg?raw'
  import PanIcon from '../icons/pan.svg?raw'
  import RotateIcon from '../icons/rotate.svg?raw'

  export let shot: Shot
  const dispatch = createEventDispatcher()
  let isOpen = false
</script>

<div
  class="settings-slider absolute left-0 top-full w-full overflow-hidden"
  class:slider-open={isOpen}
>
  <div class="flex justify-center">
    <button
      type="button"
      on:click={() => (isOpen = !isOpen)}
      class="inline-flex items-center gap-x-1.5 rounded-t-md bg-slate-900 px-2.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800"
    >
      {@html SettingsIcon}
    </button>
  </div>
  <div class="settings-rows relative flex h-1/2 w-full flex-col bg-slate-900">
    <div class="w-100 relative flex flex-col pb-4 pt-8">
      <div class="flex basis-2/3 items-stretch overflow-y-scroll px-1">
        <span
          class="isolate inline-flex w-full justify-around rounded-md shadow-sm"
        >
          <button
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.DOLLY, axis: 'y' })}
            class:active={shot.motion.y === Movement.DOLLY}
          >
            {@html DollyIcon}
            Dolly
          </button>

          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.ZOOM, axis: 'y' })}
            class:active={shot.motion.y === Movement.ZOOM}
          >
            {@html ZoomIcon}
            Zoom
          </button>

          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.ROTATE, axis: 'y' })}
            class:active={shot.motion.y === Movement.ROTATE}
          >
            {@html RotateIcon}
            Rotate
          </button>

          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.PAN, axis: 'y' })}
            class:active={shot.motion.y === Movement.PAN}
          >
            {@html PanIcon}
            Pan
          </button>
        </span>
      </div>
      <div
        class="mx-auto flex h-full basis-1/3 items-center p-2 font-bold text-white"
      >
        Up / Down
      </div>
    </div>
    <div class="w-100 flex flex-col py-4">
      <div class="flex basis-2/3 items-stretch overflow-y-scroll px-1">
        <span
          class="isolate inline-flex w-full justify-around rounded-md shadow-sm"
        >
          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.DOLLY, axis: 'x' })}
            class:active={shot.motion.x === Movement.DOLLY}
          >
            {@html DollyIcon}
            Dolly
          </button>
          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.ZOOM, axis: 'x' })}
            class:active={shot.motion.x === Movement.ZOOM}
          >
            {@html ZoomIcon}
            Zoom
          </button>
          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.ROTATE, axis: 'x' })}
            class:active={shot.motion.x === Movement.ROTATE}
          >
            {@html RotateIcon}
            Rotate
          </button>
          <button
            type="button"
            class="settings-radio-button"
            on:click={() =>
              dispatch('toggle', { movement: Movement.PAN, axis: 'x' })}
            class:active={shot.motion.x === Movement.PAN}
          >
            {@html PanIcon}
            Pan
          </button>
        </span>
      </div>
      <div
        class="mx-auto flex h-full basis-1/3 items-center p-2 font-bold text-white"
      >
        Left / Right
      </div>
    </div>
  </div>
</div>

<style lang="sass">
  .settings-slider
    top: calc(99vh - 32px)
    transition: all 400ms ease
  .slider-open 
    transform: translateY(-31vh)
  

  .settings-radio-button
    @apply relative inline-flex w-16 flex-col items-center gap-x-1.5 px-3 py-2 text-sm font-semibold text-gray-900
    color: white
    &.active 
      opacity: 1
    opacity: 0.3
</style>
