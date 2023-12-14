<script lang="ts">
  import { error } from '@sveltejs/kit'
  import Upload from './Upload.svelte'
  import Analysis from './Analysis.svelte'
  import Viewer from './Viewer.svelte'
  import type { SvelteComponent } from 'svelte'

  export let data: SvelteComponent
  $: project = data.project

  let component: any
  $: switch (project.state) {
    case 'configuring':
      component = Upload
      break
    case 'pending':
    case 'running':
    case 'failed':
      component = Analysis
      break
    case 'complete':
      component = Viewer
      break
    default:
      throw error(500, 'Invalid project state')
  }
</script>

<svelte:component this={component} {project} />
