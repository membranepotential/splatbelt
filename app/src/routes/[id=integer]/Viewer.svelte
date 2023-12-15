<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import ExportScreen from '$lib/components/ExportScreen.svelte'
  import SettingsPane from '$lib/components/SettingsPane.svelte'
  import ShotSettings from '$lib/components/ShotSettings.svelte'
  import TopNav from '$lib/components/TopNav.svelte'
  import ViewRecordToggle from '$lib/components/ViewRecordToggle.svelte'
  import type { Project } from '$lib/schemas'
  import Viewer from '$lib/services/viewer'
  import { VIEWER_STATE, type Shot } from '$lib/types'
  import { onMount } from 'svelte'
  import Player from './Player.svelte'
  import Record from './Record.svelte'
  import Exporter from './Exporter.svelte'

  /*
  Root component that views the uploaded model.
  Reads parameters from the URL query:
   - state: state of the viewer (free, record, play)
   - shot: index of the active shot
  */

  export let project: Project
  let viewer: Viewer

  let canvasContainer: HTMLDivElement

  let state = VIEWER_STATE.FREE
  let shotIdx: number = 0

  page.subscribe((p) => {
    const params = Object.fromEntries(
      p.url.searchParams.entries()
    ) as unknown as {
      state?: VIEWER_STATE
      shot?: string
    }
    if (params.state) {
      state = params.state
    }
    if (typeof params.shot === 'string') {
      shotIdx = parseInt(params.shot)
    }
  })

  $: console.log('state is now: ', state)
  $: shots = project.shots
  $: shot = shots[shotIdx] as Shot

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
    goto(`?state=PLAY&shot=${shotIdx}`)
  }

  /**
   * Spec: delete button entfernt shot aus der timline
   *
   * Actions:
   *  - Move to Free
   *  - Remove shot from project
   */
  function deleteCurrentShot() {
    goto(`?state=FREE&shot=${shotIdx}`)
    project.shots = project.shots.slice(0, -1)
  }
</script>

<div class="relative">
  <div class="z-30">
    <ViewRecordToggle {state} on:toggle={stateChange} />
    <SettingsPane {state} />
    <ShotSettings {state} on:delete={deleteCurrentShot} />
    <TopNav {state} {shots} />
    <ExportScreen />
  </div>

  {#if state === VIEWER_STATE.RECORD}
    <Record {viewer} {shot} on:shotRecorded={shotRecorded} />
  {:else if state === VIEWER_STATE.PLAY}
    <Player {viewer} shots={project.shots} {shotIdx} />
  {:else if state === VIEWER_STATE.EXPORT}
    <Exporter {viewer} shots={project.shots} />
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
