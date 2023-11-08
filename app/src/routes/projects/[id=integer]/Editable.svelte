<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { enhance } from '$app/forms'
  import type { ActionResult } from '@sveltejs/kit'

  export let action: string
  export let value: string
  export let name: string = 'value'
  export let inputClass: string = ''
  export let promptClass: string = ''
  export let promptText: string = 'edit...'

  const dispatch = createEventDispatcher<{ submit: ActionResult }>()

  let editable = false
  let inputElement: HTMLInputElement

  function enterEditMode() {
    editable = true
    setTimeout(() => inputElement && inputElement.focus())
  }

  function exitEditMode() {
    inputElement.blur()
    editable = false
  }
</script>

{#if editable}
  <form
    method="POST"
    {action}
    use:enhance={() =>
      async ({ result, update }) => {
        exitEditMode()
        await update()
        dispatch('submit', result)
      }}
  >
    <input
      {name}
      {value}
      type="text"
      class={inputClass}
      bind:this={inputElement}
      on:blur={exitEditMode}
    />
  </form>
{:else}
  <slot />
  <button class={promptClass} on:click={enterEditMode}>{promptText}</button>
{/if}
