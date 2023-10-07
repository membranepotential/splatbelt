<script lang="ts">
  import humanizeDuration from 'humanize-duration'
  import { invalidate } from '$app/navigation'
  import { toast } from '$lib/notifications/notifications'
  import type { PageData } from './$types'
  import type { Project } from '$lib/models/project'

  export let data: PageData

  async function createProject() {
    await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'New Project Title',
      }),
    })

    await invalidate('/api/projects')
    toast('Project created')
  }

  async function deleteProject(id: number) {
    await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    })

    await invalidate('/api/projects')
    toast('Project deleted')
  }

  /**
   * Database timestamp are UTC. Get current UTC time to calculate offset
   */
  function getCreatedOffset(project: Project) {
    const current = new Date()
    const now = new Date(
      current.getTime() + current.getTimezoneOffset() * 60000
    )

    return humanizeDuration(
      now.valueOf() - new Date(project.created).valueOf(),
      {
        round: true,
        units: ['y', 'mo', 'd', 'h', 'm'],
      }
    )
  }
</script>

<svelte:head>
  <title>Projects</title>
</svelte:head>

<div class="py-10">
  <header>
    <div class="px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold leading-tight tracking-tight text-gray-900">
        Projects
      </h1>
    </div>
  </header>
  <main>
    <div class="sm:px-6 lg:px-8">
      <ul role="list" class="divide-y divide-gray-100">
        {#each data.projects as project}
          <li class="flex items-center justify-between gap-x-6 py-5">
            <div class="min-w-0">
              <div class="flex items-start gap-x-3">
                <p class="text-sm font-semibold leading-6 text-gray-900">
                  {project.name}
                </p>
                <!-- <p class="rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset">{project.status }</p> -->
              </div>
              <div
                class="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500"
              >
                <p class="truncate">Created {getCreatedOffset(project)} ago</p>
              </div>
            </div>
            <div class="flex flex-none items-center gap-x-4">
              <a
                href="/projects/{project.id}/edit"
                class="hidden rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:block"
                >View project<span class="sr-only" /></a
              >

              <button
                type="button"
                on:click={() => deleteProject(project.id)}
                class="rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >Delete</button
              >
            </div>
          </li>
        {/each}
      </ul>
      <div class="mt-4">
        <button
          type="button"
          on:click={createProject}
          class="rounded-full bg-green-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >Create New Project</button
        >
      </div>
    </div>
  </main>
</div>
