<script>
  import { VIEWER_STATE } from '$lib/types'
  import ShotsService from '$lib/services/shots'
  import { get } from 'svelte/store'
  import SaveToDeviceIcon from '../icons/save-to-device.svg?raw'

  let exported = true

  function saveToDevice() {
    const shots = ShotsService.getShots()
    get(shots).forEach((shot, i) => {
      shot.events = shot.events.map((event) => {
        return {
          ...event,
          position: event.position.map((pos) => pos.toFixed(2)),
          rotation: event.rotation.map((rot) => rot.toFixed(2)),
        }
      })
    })
    exported = !exported
  }
</script>

<div
  class:hidden={exported}
  class="absolute left-0 top-0 flex h-full w-full items-center justify-center bg-slate-950"
>
  <div
    class="group inline-flex flex-col items-center justify-between gap-4 rounded-lg border-2 border-slate-800 bg-slate-900 px-6 py-7 text-lg text-indigo-100 transition-colors"
    href="#"
  >
    {@html SaveToDeviceIcon}

    <button
      on:click={saveToDevice}
      class="font-medium transition-colors group-hover:text-white"
    >
      Download to device
    </button>
  </div>
</div>
