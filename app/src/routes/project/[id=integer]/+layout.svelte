<script lang="ts">
  import type { LayoutData } from './$types'
  import type { Project } from '$lib/models/project'
  import { page } from '$app/stores'
  import { derived } from 'svelte/store'

  export let data: LayoutData
  const project: Project = data.project

  const tabs = [
    { id: 'edit', label: 'Edit' },
    { id: 'timeline', label: 'Timeline' },
  ]

  const activeTab = derived(page, (page) => page.route.id?.split('/').pop())

  const classesActive = 'bg-indigo-100 text-indigo-700'
  const classesInactive = 'text-gray-500 hover:text-gray-700'
</script>

<div class="py-10">
  <header class="mb-8">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900">
        {project.name}
      </h1>
    </div>
  </header>
  <main>
    <div class="mx-auto max-w-7xl sm:px-6 lg:px-8">
      <nav class="flex space-x-4" aria-label="Tabs">
        {#each tabs as tab}
          <a
            href="/project/{project.id}/{tab.id}"
            class="rounded-md px-3 py-2 text-sm font-medium {$activeTab ===
            tab.id
              ? classesActive
              : classesInactive}"
            aria-current="page">{tab.label}</a
          >
        {/each}
      </nav>

      <main class="mx-auto max-w-7xl">
        <slot />
      </main>
    </div>
  </main>
</div>
