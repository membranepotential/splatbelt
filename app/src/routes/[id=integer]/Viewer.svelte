<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Export from '$lib/components/Export.svelte'
  import SettingsPane from '$lib/components/SettingsPane.svelte'
  import ShotSettings from '$lib/components/ShotSettings.svelte'
  import TopNav from '$lib/components/TopNav.svelte'
  import ViewRecordToggle from '$lib/components/ViewRecordToggle.svelte'
  import type { Project } from '$lib/schemas'
  import type { Shot } from '$lib/schemas/shot'
  import Viewer from '$lib/services/viewer'
  import { VIEWER_STATE } from '$lib/types'
  import { onMount } from 'svelte'
  import { z } from 'zod'
  import Player from './Player.svelte'
  import Record from './Record.svelte'

  /*
  Root component that views the uploaded model.
  Reads parameters from the URL query:
   - state: state of the viewer (free, record, play)
   - shot: index of the active shot
  */

  const ParamSchema = z.object({
    state: z.coerce
      .string()
      .transform(
        (s) =>
          VIEWER_STATE[s.toUpperCase() as keyof typeof VIEWER_STATE] ||
          VIEWER_STATE.FREE
      ),
    shot: z.coerce.number().int().min(0).default(0),
  })

  export let project: Project
  let viewer: Viewer

  let canvasContainer: HTMLDivElement

  $: params = ParamSchema.parse(Object.fromEntries($page.url.searchParams))
  $: state = params.state || VIEWER_STATE.FREE
  $: shots = project.shots
  $: shotIdx = params.shot || 0
  $: shot = shots?.[shotIdx]

  onMount(() => {
    viewer = new Viewer(canvasContainer, {
      position: [5.99, 5.1, -12.77],
      up: [-0.07, -0.71, -0.7],
      minAlpha: 20,
    })
    return viewer.loadFile(`${project.id}/model.ply`)
  })

  function stateChange(event: CustomEvent<{ state: VIEWER_STATE }>) {
    goto(`?state=${event.detail.state}&shot=${shotIdx}`)
  }

  function shotRecorded(event: CustomEvent<{ shot: Shot }>) {
    if (project.shots.length <= shotIdx) {
      project.shots.push(event.detail.shot)
    } else {
      project.shots[shotIdx] = event.detail.shot
    }
    goto(`?state=play&shot=${shotIdx}`)
  }
</script>

<div class="relative">
  <div class="z-30">
    <ViewRecordToggle {state} on:toggle={stateChange} />
    <SettingsPane {state} />
    <ShotSettings {state} />
    <TopNav {state} {shots} />
    <Export />
  </div>

  {#if state === VIEWER_STATE.RECORD}
    <Record {viewer} {shot} on:shotRecorded={shotRecorded} />
  {:else if state === VIEWER_STATE.PLAY}
    <Player {viewer} shots={project.shots} {shotIdx} />
  {/if}

  <div
    class="canvas z-10"
    bind:this={canvasContainer}
    class:pointer-events-none={state !== VIEWER_STATE.FREE}
  />
</div>

<style>
  .canvas {
    height: 844px;
    width: 390px;
    background-color: #000;
  }
</style>
