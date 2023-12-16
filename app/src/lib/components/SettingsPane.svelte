<script lang="ts">
  import { controls } from '$lib/stores'
  import { VIEWER_STATE, Movement } from '$lib/types'
  import DollyIcon from '../icons/dolly.svg?raw'
  import ZoomIcon from '../icons/zoom.svg?raw'
  import PanIcon from '../icons/pan.svg?raw'

  export let state: VIEWER_STATE

  $: isFree = state === VIEWER_STATE.FREE

  let isOpen = false
</script>

{#if isFree}
  <div
    class="settings-slider absolute left-0 top-full w-full overflow-hidden"
    class:slider-open={isOpen}
  >
    <div class="flex justify-center">
      <button
        type="button"
        on:click={() => (isOpen = !isOpen)}
        class="inline-flex items-center gap-x-1.5 rounded-t-md bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800"
      >
        {@html DollyIcon}
      </button>
    </div>
    <div class="settings-rows relative flex h-1/2 w-full flex-col bg-slate-900">
      <div class="w-100 relative flex py-4">
        <div
          class="flex h-full basis-1/3 items-center p-4 font-bold text-white"
        >
          Up / Down
        </div>
        <div class="flex basis-2/3 items-center overflow-y-scroll px-1">
          <span class="isolate inline-flex rounded-md shadow-sm">
            <button
              class="settings-radio-button"
              on:click={() => ($controls.y = Movement.DOLLY)}
              class:active={$controls.y === Movement.DOLLY}
            >
              {@html DollyIcon}
              Dolly
            </button>

            <button
              type="button"
              class="settings-radio-button"
              on:click={() => ($controls.y = Movement.ZOOM)}
              class:active={$controls.y === Movement.ZOOM}
            >
              {@html ZoomIcon}
              Zoom
            </button>

            <button
              type="button"
              class="settings-radio-button"
              on:click={() => ($controls.y = Movement.ORBIT)}
              class:active={$controls.y === Movement.ORBIT}
            >
              {@html PanIcon}
              Pan
            </button>
          </span>
        </div>
      </div>
      <div class="w-100 flex py-4">
        <div class="flex h-full w-4/12 items-center p-4 font-bold text-white">
          Left / Right
        </div>
        <div class="flex w-8/12 items-center overflow-y-scroll px-1">
          <span class="isolate inline-flex rounded-md shadow-sm">
            <button
              type="button"
              class="settings-radio-button"
              on:click={() => ($controls.x = Movement.DOLLY)}
              class:active={$controls.x === Movement.DOLLY}
            >
              {@html DollyIcon}
              Dolly
            </button>
            <button
              type="button"
              class="settings-radio-button"
              on:click={() => ($controls.x = Movement.ZOOM)}
              class:active={$controls.x === Movement.ZOOM}
            >
              {@html ZoomIcon}
              Zoom
            </button>
            <button
              type="button"
              class="settings-radio-button"
              on:click={() => ($controls.x = Movement.ORBIT)}
              class:active={$controls.x === Movement.ORBIT}
            >
              {@html PanIcon}
              Pan
            </button>
          </span>
        </div>
      </div>
      <div class="w-100 flex py-4">
        <div class="flex h-full w-4/12 items-center p-4 font-bold text-white">
          Center Lock
        </div>
        <div
          class="flex w-8/12 items-center justify-end overflow-y-scroll px-6"
        >
          <button
            on:click={() => ($controls.centerLock = !$controls.centerLock)}
            type="button"
            class="group relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent"
            role="switch"
            aria-checked="false"
          >
            <span
              aria-hidden="true"
              class="pointer-events-none absolute h-full w-full rounded-full border-2 bg-transparent"
              class:border-gray-700={!$controls.centerLock}
            />
            <!-- Enabled: "bg-indigo-600", Not Enabled: "bg-gray-200" -->
            <span
              aria-hidden="true"
              class="pointer-events-none absolute mx-auto h-4 w-9 rounded-full bg-transparent transition-colors duration-200 ease-in-out"
              class:bg-gray-300={!$controls.centerLock}
            />
            <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
            <span
              class:translate-x-6={$controls.centerLock}
              aria-hidden="true"
              class="pointer-events-none absolute left-1 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style lang="sass">

  .settings-slider
    top: calc(99vh - 32px)
    transition: all 400ms ease
  .slider-open 
    transform: translateY(-31vh)
  

  .settings-radio-button
    @apply relative inline-flex w-20 flex-col items-center gap-x-1.5 px-3 py-2 text-sm font-semibold text-gray-900
    color: white
    &.active 
      opacity: 1
    opacity: 0.3

</style>
