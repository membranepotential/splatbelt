<script lang="ts">
  import { uploadStore, type UploadStore } from './upload'
  import type { PageData } from './$types'
  import type { Upload } from '$lib'
  import UploadItem from './UploadItem.svelte'
  import ObjectItem from './ObjectItem.svelte'
  import { AnalysisState } from '$lib/enums'

  export let data: PageData
  let uploads: UploadStore[] = []

  $: disabled = data.project.state >= AnalysisState.pending

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
    data.uploads = [...data.uploads, upload.object]
  }

  async function handleFiles(event: any) {
    for (const file of event.target.files) {
      await createUpload(file)
    }

    event.target.value = ''
  }
</script>

<ul>
  {#each data.uploads as object}
    <li class="py-2">
      <!-- <a href={upload.url} target="_blank">{upload.name}</a> -->
      <ObjectItem bind:project={data.project} {object} {disabled} />
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
