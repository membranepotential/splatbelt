<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  export let current: number
  export let total: number
  export let progress: number

  const dispatch = createEventDispatcher<{
    new: void
    redo: { idx: number }
    change: { to: number }
  }>()

  function handleClick(idx: number) {
    if (idx === current) {
      dispatch('redo', { idx })
    } else {
      dispatch('change', { to: idx })
    }
  }
</script>

<div class="shot-player-bar">
  {#each { length: total } as _, i}
    <button
      tabindex={i}
      class="shot"
      class:active={current === i}
      on:click={() => handleClick(i)}
    >
      {i + 1}

      {#if current === i}
        <div
          style="transform: translateX({progress * 100}%);"
          class="indicator"
        />
      {/if}
    </button>
  {/each}
  <button class="shot add-new bg-slate-500" on:click={() => dispatch('new')}>
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
