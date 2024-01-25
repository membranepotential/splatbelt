<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { Movement, type Shot } from '$lib/types'

  export let label: string
  export let icon: string
  export let shot: Shot
  export let movement: Movement
  export let axis: 'x' | 'y'

  const dispatch = createEventDispatcher<{
    toggle: {
      movement: Movement
      axis: 'x' | 'y'
    }
  }>()
</script>

<button
  type="button"
  on:click|stopPropagation={() => dispatch('toggle', { movement, axis })}
  on:pointerdown|stopPropagation
  class:active={shot.motion[axis] === movement}
>
  <i class="aspect-square flex-grow basis-auto">
    {@html icon}
  </i>
  <span class="mt-2 w-full">{label}</span>
</button>

<style lang="postcss">
  button {
    @apply relative inline-flex h-16 w-16 flex-col items-center text-sm font-semibold text-indigo-100 opacity-30;
  }
  button.active {
    @apply opacity-100;
  }
</style>
