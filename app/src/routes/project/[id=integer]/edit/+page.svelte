<script lang="ts">
  import { debounce } from 'lodash-es'
  import { invalidate } from '$app/navigation'
  import { createUploadTask } from '$lib/upload/s3'
  import { updated } from '$lib/models/project'
  import { createModel } from '$lib/models/model'
  import { createUpload } from '$lib/models/upload'
  import type { Project } from '$lib/models/project'

  import NameEdit from './NameEdit.svelte'
  import ModelCard from './ModelCard.svelte'
  import type { PageData } from './$types'

  export let data: PageData
  const project: Project = data.project

  $: idString = project.id.toString()
  $: uploads = project.uploads
  $: models = project.models

  let selectedFiles: FileList

  async function updateProjectNow() {
    const updatedProject = updated(project)
    console.log('Updating project', updatedProject)

    const url = `/api/projects/${project.id}`
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProject),
    })
    await invalidate(url)
  }
  const updateProject = debounce(updateProjectNow, 200)

  async function handleFilesDrop() {
    const files = Array.from(selectedFiles)
    console.log('Uploading files', files)

    const tasks = files.map(async (file) => {
      const task = createUploadTask(file, idString)

      const upload = createUpload(file, task.key)
      project.uploads = [...uploads, upload]
      console.debug('Created new file', upload)

      task.transferred.subscribe((transferred) => {
        upload.transferred = transferred
        uploads = uploads // trigger reactivity
      })

      try {
        await task.task
        await updateProject()
        console.log('Upload finished', upload)
      } catch (error) {
        uploads = uploads.filter((u) => u.name !== upload.name)
        console.error(`Error while uploading ${upload.key}`, error)
      }
    })

    await Promise.all(tasks)
  }

  async function addModel() {
    const model = createModel(project.id, uploads)
    project.models = [...models, model]
    await updateProject()
  }
</script>

<div class="py-10">
  <NameEdit bind:value={project.name} class="mb-6" on:change={updateProject} />

  <section class="mb-6 mt-6">
    <h2 class="mb-2">Uploads</h2>
    <ul>
      {#each uploads as upload}
        <li class="pb-1 pt-1">
          <!-- <a href={upload.url} target="_blank">{upload.name}</a> -->
          <span>{upload.name}</span>
          {#if upload.transferred < upload.size}
            <span class="ml-2"
              >Upload progress: {Math.round(
                100 * (upload.transferred / upload.size)
              )}%</span
            >
          {/if}
        </li>
      {/each}
    </ul>
    <div class="mt-6">
      <input
        id="file"
        type="file"
        class="text-transparent"
        multiple
        formenctype="multipart/form-data"
        accept="image/*,video/*"
        title="File"
        bind:files={selectedFiles}
        on:change={handleFilesDrop}
      />
    </div>
  </section>

  <section class="mb-6 mt-6 w-full border-b-2 border-t-2 pb-2 pt-2">
    <h2>Models</h2>
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <ul>
        {#each models as model}
          <ModelCard {uploads} {model} on:change={updateProject} />
        {/each}
        <div class="mt-6">
          <button class="border p-2" on:click={addModel}>Add Model</button>
        </div>
      </ul>
    </div>
  </section>
</div>
