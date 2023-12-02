<script>
  import { app, playerProgress } from '$lib/stores'
  let currentShot = 1
  $: percentDone = ($playerProgress.current / $playerProgress.total) * 100
</script>

<div class="shot-player-bar">
  <div class="shot bg-slate-800">
    1
    {#if currentShot == 1}
      <div style="transform: translateX({percentDone}%)" class="indicator" />
    {/if}
  </div>
  <div class="shot bg-slate-800">
    2
    {#if currentShot == 2}
      <div
        style="transform: translateX({percentDone / 10}%)"
        class="indicator"
      />
    {/if}
  </div>
  <div class="shot settings bg-slate-500">+</div>
</div>

<style lang="sass">
.shot-player-bar
  width: 100%
  position: absolute
  bottom: 18vh
  display: inline-flex
  justify-content: center
  align-items: center
  .shot 
    color: white
    position: relative
    margin: 2px
    height: 40px
    width: 40px
    display: flex
    justify-content: center
    align-items: center
    overflow: hidden
    .indicator
      position: absolute
      bottom: 0
      height: 3px
      background-color: white
      width: 100%
      left: -100%

</style>
