<script lang="ts">
  import { error } from '@sveltejs/kit'
  import Upload from './Upload.svelte'
  import Analysis from './Analysis.svelte'
  import Viewer from './Viewer.svelte'
  import type { ComponentType } from 'svelte'
  import type { LayoutLoadResponse } from './+layout.server.ts'

  export let data: LayoutLoadResponse
  $: project = data.project

  let component: ComponentType
  $: switch (project.state) {
    case 'CONFIGURING':
      component = Upload
      break
    case 'PENDING':
    case 'RUNNING':
    case 'FAILED':
      component = Analysis
      break
    case 'COMPLETE':
      component = Viewer
      break
    default:
      error(500, 'Invalid project state: ' + project.state)
  }
</script>

<svelte:component this={component} {project} />
