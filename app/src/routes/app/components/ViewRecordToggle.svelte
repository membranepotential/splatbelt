<script>
  import { app } from '$lib/stores'
  import { VIEWER_STATE } from '$lib/types'

  function toggle() {
    app.update(({ VIEWER_STATE: currentState }) => ({
      VIEWER_STATE:
        currentState === VIEWER_STATE.RECORDING
          ? VIEWER_STATE.FREE
          : VIEWER_STATE.RECORDING,
    }))
  }
  $: isRecording = $app.VIEWER_STATE === VIEWER_STATE.RECORDING
</script>

<div class="absolute top-32 flex w-full flex-col items-center justify-center">
  <button
    on:click={toggle}
    type="button"
    class="border-bg-gray-200 relative inline-flex h-9 w-16 flex-shrink-0 cursor-pointer rounded-full border-2 border-green-900 bg-transparent transition-colors duration-200 ease-in-out"
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="green"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
          />
        </svg>
      </span>
      <!-- Enabled: "opacity-100 duration-200 ease-in", Not Enabled: "opacity-0 duration-100 ease-out" -->
      <span
        class="absolute inset-0 flex h-full w-full items-center justify-center transition-opacity duration-100 ease-out"
        aria-hidden="true"
        class:opacity-0={!isRecording}
        class:opacity-100={isRecording}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="red"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </span>
    </span>
  </button>
  <div class="flex py-2 text-white">
    <span class:hidden={!isRecording}>Record</span>
    <span class:hidden={isRecording}>View</span>
  </div>
</div>
