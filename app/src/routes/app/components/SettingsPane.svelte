<script lang="ts">
  import { app, controls } from '$lib/stores'
  import { CAMERA_RECORDING_MODE, VIEWER_STATE } from '$lib/types'
  import { derived } from 'svelte/store'
  $: isFree = $app.VIEWER_STATE === VIEWER_STATE.FREE
  $: isRecord = $app.VIEWER_STATE === VIEWER_STATE.RECORD
  $: isPlay = $app.VIEWER_STATE === VIEWER_STATE.PLAY

  let toggleState = false
  function toggle(newState?: boolean) {
    if (typeof newState === 'boolean') {
      toggleState = newState
    } else {
      toggleState = !toggleState
    }
  }
  function toggleCenterLock() {
    alert('NYI')
    //TODO: Add to controls store
  }
  function updateControls(key: string, mode: CAMERA_RECORDING_MODE) {
    controls.update((c) => ({
      ...c,
      [key]: mode,
    }))
  }

  const activeX = derived(controls, ($controls) => $controls.x)
  const activeY = derived(controls, ($controls) => $controls.y)

  app.subscribe(() => {
    toggle(false)
  })
</script>

{#if isFree}
  <div
    class="settings-slider absolute left-0 top-full w-full overflow-hidden"
    class:slider-open={toggleState}
  >
    <div class="flex justify-center">
      <button
        type="button"
        on:click={() => toggle()}
        class="inline-flex items-center gap-x-1.5 rounded-t-md bg-slate-900 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
          />
        </svg>
      </button>
    </div>
    <div class="settings-rows relative flex h-1/2 w-full flex-col bg-slate-900">
      <div class="w-100 relative flex py-4">
        <div class="  flex h-full w-4/12 items-center p-4 font-bold text-white">
          Up / Down
        </div>
        <div class="flex w-8/12 items-center overflow-y-scroll px-1">
          <span class="isolate inline-flex rounded-md shadow-sm">
            <button
              class="settings-radio-button active relative inline-flex w-20 flex-col items-center gap-x-1.5 rounded-l-md px-1 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('y', CAMERA_RECORDING_MODE.DOLLY)}
              class:active={$activeY === CAMERA_RECORDING_MODE.DOLLY}
            >
              <svg
                width="24px"
                height="24px"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M7 4L7 5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M7 9L7 10"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M17 20V4M17 4L20 7M17 4L14 7"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M7 14V20M7 20L10 17M7 20L4 17"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              > Dolly
            </button>

            <button
              type="button"
              class="settings-radio-button relative inline-flex w-20 flex-col items-center gap-x-1.5 px-3 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('y', CAMERA_RECORDING_MODE.ZOOM)}
              class:active={$activeY === CAMERA_RECORDING_MODE.ZOOM}
            >
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M5 6C5.55228 6 6 5.55228 6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6Z"
                  fill="#000000"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M19 20C19.5523 20 20 19.5523 20 19C20 18.4477 19.5523 18 19 18C18.4477 18 18 18.4477 18 19C18 19.5523 18.4477 20 19 20Z"
                  fill="#000000"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M19 19L17.5 17.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M15.5 15.5L14.5 14.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M12.5 12.5L11.5 11.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M9.5 9.5L8.5 8.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M6.5 6.5L5 5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
              Zoom
            </button>

            <button
              type="button"
              class="settings-radio-button relative inline-flex w-20 flex-col items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('y', CAMERA_RECORDING_MODE.PAN)}
              class:active={$activeY === CAMERA_RECORDING_MODE.PAN}
            >
              <svg
                width="24px"
                height="24px"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M9 12H22M22 12L19 9M22 12L19 15"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
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
              class="settings-radio-button relative inline-flex w-20 flex-col items-center gap-x-1.5 rounded-l-md px-1 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('x', CAMERA_RECORDING_MODE.DOLLY)}
              class:active={$activeX === CAMERA_RECORDING_MODE.DOLLY}
            >
              <svg
                width="24px"
                height="24px"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M7 4L7 5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M7 9L7 10"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M17 20V4M17 4L20 7M17 4L14 7"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M7 14V20M7 20L10 17M7 20L4 17"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
              Dolly
            </button>
            <button
              type="button"
              class="settings-radio-button relative inline-flex w-20 flex-col items-center gap-x-1.5 px-3 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('x', CAMERA_RECORDING_MODE.ZOOM)}
              class:active={$activeX === CAMERA_RECORDING_MODE.ZOOM}
            >
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M5 6C5.55228 6 6 5.55228 6 5C6 4.44772 5.55228 4 5 4C4.44772 4 4 4.44772 4 5C4 5.55228 4.44772 6 5 6Z"
                  fill="#000000"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M19 20C19.5523 20 20 19.5523 20 19C20 18.4477 19.5523 18 19 18C18.4477 18 18 18.4477 18 19C18 19.5523 18.4477 20 19 20Z"
                  fill="#000000"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M19 19L17.5 17.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M15.5 15.5L14.5 14.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M12.5 12.5L11.5 11.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M9.5 9.5L8.5 8.5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M6.5 6.5L5 5"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
              Zoom
            </button>
            <button
              type="button"
              class="settings-radio-button relative inline-flex w-20 flex-col items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900"
              on:click={() => updateControls('x', CAMERA_RECORDING_MODE.PAN)}
              class:active={$activeX === CAMERA_RECORDING_MODE.PAN}
            >
              <svg
                width="24px"
                height="24px"
                stroke-width="1.5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                color="#000000"
                ><path
                  d="M4 14C2.89543 14 2 13.1046 2 12C2 10.8954 2.89543 10 4 10C5.10457 10 6 10.8954 6 12C6 13.1046 5.10457 14 4 14Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /><path
                  d="M9 12H22M22 12L19 9M22 12L19 15"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                /></svg
              >
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
            on:click={toggleCenterLock}
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
    color: white
    &.active 
      opacity: 1
    opacity: 0.3
    svg
      path
        stroke: white
</style>
