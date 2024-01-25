<script lang="ts">
  import { VIEWER_STATE } from '$lib/types'
  import { createEventDispatcher } from 'svelte'
  import TogglePlayIcon from '../icons/toggle-play.svg?raw'
  import ToggleRecordIcon from '../icons/toggle-record.svg?raw'

  export let state: VIEWER_STATE = VIEWER_STATE.FREE

  $: isRecording = state === VIEWER_STATE.RECORD
  $: isFree = state === VIEWER_STATE.FREE
  $: isExporting = state === VIEWER_STATE.EXPORT

  const dispatch = createEventDispatcher<{ toggle: VIEWER_STATE }>()

  function toggle() {
    switch (state) {
      case VIEWER_STATE.FREE:
        dispatch('toggle', VIEWER_STATE.RECORD)
        break
      case VIEWER_STATE.RECORD:
        dispatch('toggle', VIEWER_STATE.FREE)
        break
      default:
        break
    }
  }
</script>

{#if isFree || isRecording || isExporting}
  <div
    class="absolute left-1/3 top-16 flex w-1/6 translate-x-[52%] flex-col items-center justify-center"
  >
    <button
      on:click={toggle}
      type="button"
      class="border-bg-gray-200 relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-green-900 bg-transparent backdrop-blur transition-colors duration-200 ease-in-out"
      class:border-red-800={isRecording}
      role="switch"
      aria-checked="false"
    >
      <span class="sr-only">Use setting</span>
      <!-- Enabled: "translate-x-5", Not Enabled: "translate-x-0" -->
      <span
        class="pointer-events-none relative inline-block h-8 w-8 translate-x-0 transform rounded-full shadow ring-0 transition duration-200 ease-in-out"
        class:translate-x-7={isRecording}
      >
        <!-- Enabled: "opacity-0 duration-100 ease-out", Not Enabled: "opacity-100 duration-200 ease-in" -->
        <span
          class="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-200 ease-in"
          aria-hidden="true"
          class:opacity-0={isRecording}
          class:opacity-100={!isRecording}
        >
          {@html TogglePlayIcon}
        </span>
        <!-- Enabled: "opacity-100 duration-200 ease-in", Not Enabled: "opacity-0 duration-100 ease-out" -->
        <span
          class="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-100 ease-out"
          aria-hidden="true"
          class:opacity-0={!isRecording}
          class:opacity-100={isRecording}
        >
          {@html ToggleRecordIcon}
        </span>
      </span>
    </button>
    <div class="flex pt-2 text-white">
      <span class:hidden={!isFree}>View</span>
      <span class:hidden={!isRecording}>Record</span>
    </div>
  </div>

  <!-- Move these to <Hints />? -->
  <div
    class="help-text pointer-events-none absolute bottom-52 left-0 w-full text-center text-white opacity-70"
  >
    <p class:hidden={!isFree}>
      View and Move Model<br />
      Tap to assign center
    </p>
    <span class:hidden={!isRecording}>Swipe to record shot</span>
    <span class:hidden={!isExporting}
      >Sit back and relax while we capture your shots</span
    >
  </div>
{/if}
