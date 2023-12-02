<script lang="ts">
  import { onMount } from 'svelte'
  import { Viewer } from '$splats'
  import { app } from '$lib/stores'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { ViewerEngine } from '$lib/viewer/engine'
  import GestureService from '$lib/services/gesture'
  import CameraService from '$lib/services/camera'
  import RenderService from '$lib/services/render'
  import { VIEWER_STATE } from '$lib/types'

  export let data: PageData

  let canvasContainer: HTMLDivElement
  let viewer: Viewer
  let engine: ViewerEngine

  onMount(async () => {
    viewer = new Viewer({
      rootElement: canvasContainer,
      initialCameraPosition: [5.99, 5.1, -12.77],
      initialCameraLookAt: [0, 0, 0],
      cameraUp: [-0.07, -0.71, -0.7],
      splatAlphaRemovalThreshold: 20,
    })
    viewer.init()

    await viewer.loadFile(data.pointCloudUrl)
    viewer.start()

    engine = new ViewerEngine(viewer)
    CameraService.link(viewer)
    GestureService.link(viewer)
    RenderService.link(viewer)
  })

  const replayEvents = () => {
    engine?.saveAndPlayShot()
  }
</script>

<div class="relative">
  <UI on:replay={replayEvents} />
  {#if $app.VIEWER_STATE === VIEWER_STATE.RECORD}
    <div
      id="canvaswrap"
      class="canvaswrap absolute inset-0 z-20"
      on:pointermove={GestureService.handleEventMove}
      on:pointerdown={GestureService.handleEventDown}
      on:pointerup={GestureService.handleEventUp}
    />
  {/if}
  <div
    class="canvas z-10"
    bind:this={canvasContainer}
    class:pointer-events-none={$app.VIEWER_STATE === VIEWER_STATE.RECORD}
  />
</div>

<style>
  .canvas {
    height: 844px;
    width: 390px;
    background-color: #000;
  }
</style>
