<script>
  import ViewRecordToggle from './ViewRecordToggle.svelte'
  import SettingsPane from './SettingsPane.svelte'
  import ReplayButton from './ReplayButton.svelte'
  import TempProgressBar from './TempProgressBar.svelte'
</script>

<ReplayButton on:replay />
<ViewRecordToggle />
<SettingsPane />
<TempProgressBar />

<style>
</style>
