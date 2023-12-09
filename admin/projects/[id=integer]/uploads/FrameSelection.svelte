<script lang="ts">
  import type { FrameConfig, S3Object } from '$lib/schemas'

  export let object: S3Object
  export let config: FrameConfig
  export let disabled: boolean = false

  $: isVideo = object.type.startsWith('video')
</script>

<div class="flex h-8 w-full items-center pr-4">
  <span class="grow">{object.name}</span>
  {#if isVideo}
    <select bind:value={config.type} class="mr-2 w-fit px-2 text-sm" {disabled}>
      <option value="num">Num</option>
      <option value="list">List</option>
    </select>
    <div class="w-32">
      {#if config.type === 'num'}
        <input
          type="text"
          class="input-bg-white w-full text-sm"
          bind:value={config.num}
          {disabled}
        />
      {:else if config.type === 'list'}
        <button class="btn-action w-full text-sm" {disabled}>Select...</button>
      {/if}
    </div>
  {/if}
</div>
