<script>
  import { app } from '$lib/stores'
  import { VIEWER_STATE } from '$lib/types'
  import { createEventDispatcher } from 'svelte'
  import { events } from '$lib/stores'
  const dispatch = createEventDispatcher()

  let count = 0
  events.subscribe((e) => {
    count = e.length
  })

  function replay() {
    dispatch('replay')
  }

  $: isVisible = $app.VIEWER_STATE === VIEWER_STATE.FREE && count > 0
</script>

<button
  on:click={replay}
  class="color-white absolute right-1/2 top-0 z-10 bg-red-400"
  class:hidden={!isVisible}
>
  Replay {count} events
</button>
