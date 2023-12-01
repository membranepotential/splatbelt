<script>
  import ViewRecordToggle from './ViewRecordToggle.svelte'
  import SettingsPane from './SettingsPane.svelte'

  import { createEventDispatcher } from 'svelte'
  import { events } from '$lib/stores'
  const dispatch = createEventDispatcher()

  let count = 0
  events.subscribe((e) => {
    count = e.length
  })

  function replayLast() {
    dispatch('replay')
  }
</script>

<div
  on:click={replayLast}
  class="color-white absolute right-0 top-0 z-10 bg-red-400"
>
  Replay {count} events
</div>
<ViewRecordToggle />
<SettingsPane />

<style>
</style>
