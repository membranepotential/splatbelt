<script lang="ts">
  import { uploadStore, type UploadStore } from './upload'
  import type { PageData } from './$types'
  import { FrameConfig, type ModelConfig, type Upload } from '$lib/schemas'
  import UploadItem from './UploadItem.svelte'
  import ObjectItem from './FrameSelection.svelte'

  export let data: PageData
  export let config: ModelConfig

  $: objects = data.objects
  $: frames = Object.fromEntries(
    objects.map((obj) => [
      obj.name,
      FrameConfig.parse(config?.frames[obj.name]),
    ])
  )

  $: disabled = data.project.state != 'configuring'

  let uploads: UploadStore[] = []

  function uploadInProgress(file: File) {
    return uploads.some(({ object }) => object.name == file.name)
  }

  async function createUpload(file: File) {
    if (uploadInProgress(file)) {
      console.log('File already uploading', file.name)
      return
    }

    const upload = await uploadStore(file, uploadDone)
    uploads = [...uploads, upload]
  }

  function uploadDone(upload: Upload) {
    uploads = uploads.filter(({ object }) => object.name != upload.object.name)
    data.objects = [...data.objects, upload.object]
  }

  async function handleFiles(event: any) {
    for (const file of event.target.files) {
      await createUpload(file)
    }

    event.target.value = ''
  }
</script>

<ul>
  {#each objects as object}
    <li class="py-2">
      <!-- <a href={upload.url} target="_blank">{upload.name}</a> -->
      <ObjectItem bind:config={frames[object.name]} {object} {disabled} />
    </li>
  {/each}
  {#each uploads as upload}
    <li class="py-4">
      <UploadItem {upload} />
    </li>
  {/each}
</ul>

{#if !disabled}
  <div class="mt-8">
    <input
      type="file"
      accept="image/*,video/*"
      multiple
      on:change={handleFiles}
    />
  </div>
{/if}
