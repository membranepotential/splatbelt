<script lang="ts">
  import type { LayoutData } from "./$types";
  import type { Project } from "$lib/models/project";

  export let data: LayoutData;
  const project: Project = data.project;

  const tabs = [
    { id: "info", label: "Info" },
    { id: "timeline", label: "Timeline" },
  ];
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
      <div>
        <div class="sm:hidden">
          <label for="tabs" class="sr-only">Select a tab</label>
          <!-- Use an "onChange" listener to redirect the user to the selected tab URL. -->
          <select
            id="tabs"
            name="tabs"
            class="block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          >
            {#each tabs as tab}
              <option selected="true">{tab.label}</option>
            {/each}
          </select>
        </div>
        <div class="hidden sm:block">
          <nav class="flex space-x-4" aria-label="Tabs">
            <a
              href="/project/{project.id}/info"
              class="bg-indigo-100 text-indigo-700 rounded-md px-3 py-2 text-sm font-medium"
              aria-current="page">Info</a
            >
            <a
              href="/project/{project.id}/timeline"
              class="text-gray-500 hover:text-gray-700 rounded-md px-3 py-2 text-sm font-medium"
              >Timeline</a
            >
          </nav>
        </div>
      </div>

      <main class="mx-auto max-w-7xl">
        <slot />
      </main>
    </div>
  </main>
</div>
