<script lang="ts">
  import type { PageData } from './$types'
  import Upload from './Upload.svelte'
  import Analysis from './Analysis.svelte'
  import Viewer from './Viewer.svelte'

  export let data: PageData
  $: project = data.project
</script>

{#if project.state === 'configuring'}
  <Upload {project} />
{:else if project.state in ['pending', 'running', 'failed']}
  <Analysis {project} />
{:else if project.state === 'complete'}
  <Viewer {project} />
{/if}
