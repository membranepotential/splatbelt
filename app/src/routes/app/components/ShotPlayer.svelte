<script>
  import { app, playerProgress } from '$lib/stores'
  import { VIEWER_STATE } from '$lib/types'
  import ShotsService from '$lib/services/shots'

  const shots = ShotsService.getShots()
  const currentShot = ShotsService.getCurrentShot()
  let deselectionCheck = -1
  let deselectionFlag = false

  function checkAndSetShot(i) {
    if (deselectionCheck == i && !deselectionFlag) {
      deselectionCheck = i
      deselectionFlag = true
      ShotsService.setCurrentShot(-1)
    } else {
      ShotsService.setCurrentShot(i)
      deselectionCheck = i
      deselectionFlag = false
    }
  }

  function addAndSetCurrent() {
    ShotsService.addShotAndSetCurrent()
    deselectionFlag = false
    deselectionCheck = -1
  }

  $: percentDone = ($playerProgress.current / $playerProgress.total) * 100
  $: isVisible = $app.VIEWER_STATE === VIEWER_STATE.PLAY

  $: console.log($currentShot)

  // $: {
  //   if (percentDone > 99) nextShot($currentShot, $shots)
  // }
</script>

{#if isVisible}
  <div class="shot-player-bar">
    {#each $shots as shot, i}
      <div
        class="shot"
        class:active={$currentShot === i}
        on:click={() => checkAndSetShot(i)}
      >
        {i + 1}

        {#if $currentShot == i || deselectionCheck == i}
          <div
            style="transform: translateX({percentDone}%);"
            class="indicator"
          />
        {/if}
      </div>
    {/each}

    <div class="shot add-new bg-slate-500" on:click={() => addAndSetCurrent()}>
      +
    </div>
  </div>
{/if}

<style lang="sass">
.shot-player-bar
  width: 100%
  position: absolute
  bottom: 14vh
  display: flex
  justify-content: center
  align-items: center
  overflow: scroll
  .shot 
    color: white
    position: relative
    margin: 3px
    height: 60px
    width: 50px
    display: flex
    justify-content: center
    align-items: center
    overflow: hidden
    border-radius: 7px
    @apply bg-slate-900
    &.add-new
      height: 50px
    
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
