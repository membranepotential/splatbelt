<script>
  import { app, playerProgress } from '$lib/stores'
  import { VIEWER_STATE } from '$lib/types'

  $: percentDone = ($playerProgress.current / $playerProgress.total) * 100
  $: isVisible = $app.VIEWER_STATE !== VIEWER_STATE.RECORD
</script>

<div
  class="absolute bottom-0 top-0 z-10 h-1 w-14 bg-red-400"
  class:hidden={!isVisible}
>
  <div class="relative h-full">
    <div
      class="absolute left-0 top-0 h-full bg-green-400"
      style="width: {percentDone}%"
    />
  </div>
</div>
