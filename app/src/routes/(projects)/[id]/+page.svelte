<script lang="ts">
  import type { PageData } from './$types'
  import { AnalysisState } from '$lib/schemas'
  import WaitScreen from '$lib/components/WaitScreen.svelte'
  import Viewer from './Viewer.svelte'

  export let data: PageData
  $: project = data.project
</script>

<svelte:head>
  <title>{project.name} | Splatbelt</title>
</svelte:head>
{#if project.state !== AnalysisState.COMPLETE}
  <WaitScreen />
{:else}
  <Viewer {project} />
{/if}
