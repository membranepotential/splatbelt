<script lang="ts">
  import { debounce, isEqual, cloneDeep } from 'lodash-es'
  import type { LayoutData } from './$types'
  import { page } from '$app/stores'
  import { derived } from 'svelte/store'
  import { toast } from '$lib/notifications/notifications'
  import Editable from './Editable.svelte'
  import { deserialize } from '$app/forms'
  import type { ActionResult } from '@sveltejs/kit'
  import { onMount, onDestroy } from 'svelte'
  import { invalidateAll } from '$app/navigation'
  import type { ModelConfig } from '$lib'
  import { AnalysisState } from '$lib/enums'
  import { modelConfig } from '$lib/schemas'
  import Error from '../../+error.svelte'

  export let data: LayoutData
  $: project = data.project
  $: locked = project.state >= AnalysisState.pending

  let origConfig: ModelConfig
  let needsUpdate = false
  let watcher: NodeJS.Timeout | undefined
  let parseError = null as Error | null
  let activeRequest: Promise<Response> | undefined

  const cloneOrigConfig = (config: ModelConfig) => {
    origConfig = cloneDeep(config)
  }

  const configHasChanged = (config: ModelConfig) => {
    if (!origConfig) {
      cloneOrigConfig(config)
      return false
    }
    return !isEqual(config, origConfig)
  }

  onMount(() => {
    watcher = setInterval(() => {
      try {
        const config = modelConfig.parse(project.config)
        parseError = null

        if (!activeRequest && configHasChanged(config)) {
          console.log(project.config)
          needsUpdate = true
          submit(config)
          cloneOrigConfig(config)
        }
      } catch (error: any) {
        parseError = error
      }
    }, 200)
  })

  onDestroy(() => {
    if (watcher) {
      clearInterval(watcher)
    }
  })

  const submit = debounce(async (config: ModelConfig) => {
    try {
      activeRequest = fetch(`/projects/${project.id}?/updateConfig`, {
        method: 'POST',
        body: JSON.stringify(config),
      })

      console.log('Submitting config')
      const response = await activeRequest
      const result: ActionResult = deserialize(await response.text())

      if (result.type === 'success') {
        invalidateAll()
        cloneOrigConfig(config)
        needsUpdate = false
      } else if (result.type === 'error') {
        throw result.error
      } else if (result.type === 'failure') {
        throw new Error(
          result.data?.message ?? `Unknown error ${result.status}`
        )
      }
    } catch (error: any) {
      console.log(error)
    }

    activeRequest = undefined
  }, 1000)

  const tabs = [
    { id: 'uploads', label: 'Uploads' },
    { id: 'edit', label: 'Edit' },
    { id: 'viewer', label: 'Viewer' },
  ]

  const activeTab = derived(page, (page) => page.route.id?.split('/').pop())

  const classesActive = 'bg-indigo-100 text-indigo-700'
  const classesInactive = 'text-gray-500 hover:text-gray-700'
</script>

<svelte:head>
  <title>Project | {project.name}</title>
</svelte:head>

<div class="py-10">
  <header class="mb-8">
    <div class="flex items-baseline px-4 sm:px-6 lg:px-8">
      <span class="grow">
        <Editable
          action={`/projects/${project.id}?/rename`}
          value={project.name}
          promptClass="mx-2 text-sm text-gray-500 hover:cursor-pointer hover:underline"
          on:submit={() => toast('Project name updated')}
        >
          <h1
            class="inline text-3xl font-bold leading-tight tracking-tight text-gray-900"
          >
            {project.name}
          </h1>
        </Editable>
      </span>
      <span class="text-sm">
        Last Update: {new Date(project.updated).toLocaleString()}
        <span class="pl-1">
          {#if parseError}
            <span>parse errors</span>
          {:else if needsUpdate}
            <span>out of sync</span>
          {:else if locked}
            <span>Analysis: {project.state}</span>
          {:else}
            <span>in sync</span>
          {/if}
        </span>
      </span>
    </div>
  </header>
  <main>
    <div class="sm:px-6 lg:px-8">
      <nav class="flex space-x-4" aria-label="Tabs">
        {#each tabs as tab}
          <a
            href="/projects/{project.id}/{tab.id}"
            class="rounded-md px-3 py-2 text-sm font-medium {$activeTab ===
            tab.id
              ? classesActive
              : classesInactive}"
            aria-current="page">{tab.label}</a
          >
        {/each}
      </nav>

      <main class="py-10">
        <slot />
      </main>
    </div>
  </main>
</div>
