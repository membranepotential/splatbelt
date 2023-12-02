<script>
  import ViewRecordToggle from './ViewRecordToggle.svelte'
  import SettingsPane from './SettingsPane.svelte'
  import ShotPlayer from './ShotPlayer.svelte'
  import ShotSettings from './ShotSettings.svelte'
  import { createEventDispatcher } from 'svelte'
  import { events } from '$lib/stores'
  import TopNav from './TopNav.svelte'
  import Upload from './Upload.svelte'
  import Export from './Export.svelte'

  const dispatch = createEventDispatcher()

  let count = 0
  events.subscribe((e) => {
    count = e.length
  })

  function replayLast() {
    dispatch('replay')
  }
</script>

<div class="z-30">
  <!-- <ReplayButton on:replay /> -->
  <ViewRecordToggle />
  <SettingsPane />
  <ShotPlayer />
  <ShotSettings />
  <TopNav />
  <Export />
</div>

<!-- <Upload /> -->

<style>
</style>
