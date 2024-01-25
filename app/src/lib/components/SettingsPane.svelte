<script lang="ts">
  import { type Shot, Movement } from '$lib/types'
  import SettingsIcon from '../icons/settings.svg?raw'
  import DollyIcon from '../icons/dolly.svg?raw'
  import ZoomIcon from '../icons/zoom.svg?raw'
  import PanIcon from '../icons/pan.svg?raw'
  import RotateIcon from '../icons/rotate.svg?raw'
  import MovementSetting from './MovementSetting.svelte'

  export let shot: Shot
  let isOpen = false
</script>

<div
  class="settings-slider absolute left-0 top-full h-full w-full overflow-hidden"
  class:slider-open={isOpen}
>
  <div class="flex justify-center">
    <button
      type="button"
      on:click|stopPropagation={() => (isOpen = !isOpen)}
      on:pointerdown|stopPropagation
      class="inline-flex items-center gap-x-1.5 rounded-t-md bg-slate-900 px-2.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800"
    >
      {@html SettingsIcon}
    </button>
  </div>
  <div
    class="settings-rows relative flex h-1/2 w-full flex-col overflow-hidden bg-slate-900"
  >
    <div class="w-100 relative flex flex-col pb-4 pt-8">
      <div class="flex basis-2/3 items-stretch overflow-hidden px-1">
        <span
          class="isolate inline-flex w-full justify-around overflow-hidden rounded-md shadow-sm"
        >
          <MovementSetting
            label="Dolly"
            icon={DollyIcon}
            {shot}
            movement={Movement.DOLLY}
            axis="y"
            on:toggle
          />
          <MovementSetting
            label="Zoom"
            icon={ZoomIcon}
            {shot}
            movement={Movement.ZOOM}
            axis="y"
            on:toggle
          />
          <MovementSetting
            label="Rotate"
            icon={RotateIcon}
            {shot}
            movement={Movement.ROTATE}
            axis="y"
            on:toggle
          />
          <MovementSetting
            label="Pan"
            icon={PanIcon}
            {shot}
            movement={Movement.PAN}
            axis="y"
            on:toggle
          />
        </span>
      </div>
      <div
        class="mx-auto flex h-full basis-1/3 items-center p-2 text-sm font-bold text-white"
      >
        Up / Down
      </div>
    </div>
    <div class="w-100 flex flex-col">
      <div class="flex basis-2/3 items-stretch overflow-hidden px-1">
        <span
          class="isolate inline-flex w-full justify-around overflow-hidden rounded-md shadow-sm"
        >
          <MovementSetting
            label="Dolly"
            icon={DollyIcon}
            {shot}
            movement={Movement.DOLLY}
            axis="x"
            on:toggle
          />
          <MovementSetting
            label="Zoom"
            icon={ZoomIcon}
            {shot}
            movement={Movement.ZOOM}
            axis="x"
            on:toggle
          />
          <MovementSetting
            label="Rotate"
            icon={RotateIcon}
            {shot}
            movement={Movement.ROTATE}
            axis="x"
            on:toggle
          />
          <MovementSetting
            label="Pan"
            icon={PanIcon}
            {shot}
            movement={Movement.PAN}
            axis="x"
            on:toggle
          />
        </span>
      </div>
      <div
        class="mx-auto flex h-full basis-1/3 items-center p-2 text-sm font-bold text-white"
      >
        Left / Right
      </div>
    </div>
  </div>
</div>

<style lang="sass">
  .settings-slider
    top: calc(99dvh - 32px)
    transition: all 400ms ease

  .slider-open 
    transform: translateY(-31dvh)
</style>
