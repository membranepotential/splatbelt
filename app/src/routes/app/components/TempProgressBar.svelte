<script>
  import { playerProgress } from '$lib/stores'

  $: percentDone = ($playerProgress.current / $playerProgress.total) * 100
</script>

<div class="absolute bottom-0 top-0 z-10 h-4 w-14 bg-red-400">
  <div class="relative h-full">
    <div
      class="absolute left-0 top-0 h-full bg-green-400"
      style="width: {percentDone}%"
    />
  </div>
</div>
