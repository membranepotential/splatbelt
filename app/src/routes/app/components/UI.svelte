<script>
  import ViewRecordToggle from './ViewRecordToggle.svelte'
  import SettingsPane from './SettingsPane.svelte'
  import ReplayButton from './ReplayButton.svelte'
  import TempProgressBar from './TempProgressBar.svelte'
  import ShotPlayer from './ShotPlayer.svelte'

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

<button
  on:click={replayLast}
  class="color-white absolute right-0 top-0 z-10 bg-red-400"
>
  Replay {count} events
</button>

<ReplayButton on:replay />
<ViewRecordToggle />
<SettingsPane />
<TempProgressBar />
<ShotPlayer />

<style>
</style>
