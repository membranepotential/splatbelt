<script lang="ts">
  import { onMount } from 'svelte'
  import { Viewer } from '$splats'
  import { app } from '$lib/stores'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { ViewerEngine } from '$lib/viewer/engine'
  import GestureService from '$lib/services/gesture'
  import CameraService from '$lib/services/camera'
  import { VIEWER_STATE } from '$lib/types'

  export let data: PageData
  let canvasContainer: HTMLDivElement
  let viewer: GaussianSplat3D.Viewer

  let lastEvent: PointerEvent | null = null

  let engine = null

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
  })

  const replayEvents = () => {
    engine?.replayEvents()
  }
</script>

<div class="relative">
  <UI on:replay={replayEvents} />
  <div
    class="canvaswrap"
    on:pointermove={GestureService.handleEventMoveThrottled}
    on:pointerdown={GestureService.handleEventDown}
    on:pointerup={GestureService.handleEventUp}
    on:pointercancel={GestureService.handleEventUp}
  >
    <div
      class="canvas"
      bind:this={canvasContainer}
      class:pointer-events-none={$app.VIEWER_STATE === VIEWER_STATE.RECORD}
    />
  </div>
</div>

<style>
  .canvas {
    height: 844px;
    width: 390px;
    background-color: #000;
  }
</style>
