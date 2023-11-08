<script lang="ts">
  import type { Project, S3Object } from '$lib'

  export let project: Project
  export let object: S3Object
  export let disabled: boolean = false

  $: isVideo = object.type.startsWith('video')

  const getSetting = (object: S3Object) => {
    if (!(object.name in project.config.frames)) {
      if (isVideo) {
        project.config.frames[object.name] = { type: 'num', num: 200 }
      }
    }
    return project.config.frames[object.name]
  }
  $: setting = getSetting(object)
</script>

<div class="flex h-8 w-full items-center pr-4">
  <span class="grow">{object.name}</span>
  {#if isVideo}
    <select
      bind:value={setting.type}
      class="mr-2 w-fit px-2 text-sm"
      {disabled}
    >
      <option value="num">Num</option>
      <option value="list">List</option>
    </select>
    <div class="w-32">
      {#if setting.type === 'num'}
        <input
          type="text"
          class="input-bg-white w-full text-sm"
          bind:value={setting.num}
          {disabled}
        />
      {:else if setting.type === 'list'}
        <button class="btn-action w-full text-sm" {disabled}>Select...</button>
      {/if}
    </div>
  {/if}
</div>
