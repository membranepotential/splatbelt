<script>
  import { app, playerProgress } from '$lib/stores'
  import { VIEWER_STATE } from '$lib/types'
  import ShotsService from '$lib/services/shots'

  const shots = ShotsService.getShots()
  const currentShot = ShotsService.getCurrentShot()

  $: percentDone = ($playerProgress.current / $playerProgress.total) * 100
  $: isVisible = $app.VIEWER_STATE === VIEWER_STATE.PLAY

  $: console.log($currentShot)
</script>

{#if isVisible}
  <div class="shot-player-bar">
    {#each $shots as shot, i}
      <div
        class="shot"
        class:active={$currentShot === i}
        on:click={() => ShotsService.setCurrentShot(i)}
      >
        {i + 1}

        {#if $currentShot === i}
          <div
            style="transform: translateX({percentDone}%);"
            class="indicator"
          />
        {/if}
      </div>
    {/each}

    <div
      class="shot bg-slate-500"
      on:click={() => ShotsService.addShotAndSetCurrent()}
    >
      +
    </div>
  </div>
{/if}

<style lang="sass">
.shot-player-bar
  width: 100%
  position: absolute
  bottom: 14vh
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
    @apply bg-slate-800
    
    &.active
      background-color: white
      @apply bg-slate-600
    
    .indicator
      position: absolute
      bottom: 0
      height: 3px
      background-color: white
      width: 100%
      left: -100%
</style>
