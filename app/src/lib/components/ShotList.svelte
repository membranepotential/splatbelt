<script lang="ts">
  import type { Shot } from '$lib/types'
  import { createEventDispatcher } from 'svelte'
  import type { Writable } from 'svelte/store'

  export let progress: Writable<number>
  export let shots: Shot[]
  export let shotIdx: number

  const dispatch = createEventDispatcher<{
    newShot: void
    changeShot: { to: number }
  }>()
</script>

<div class="shot-player-bar">
  {#each shots as _, i}
    <button
      tabindex={i}
      class="shot"
      class:active={shotIdx === i}
      on:click={() => dispatch('changeShot', { to: i })}
    >
      {i + 1}

      {#if shotIdx === i}
        <div
          style="transform: translateX({$progress * 100}%);"
          class="indicator"
        />
      {/if}
    </button>
  {/each}
  <button
    class="shot add-new bg-slate-500"
    on:click={() => dispatch('newShot')}
  >
    +
  </button>
</div>

<style lang="sass">
.shot-player-bar
  width: 100%
  position: absolute
  bottom: 14vh
  display: flex
  justify-content: center
  align-items: center
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
