<script lang="ts">
  import { onMount } from 'svelte'
  import { Viewer } from '$splats'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { ViewerEngine } from '$lib/viewer/engine'

  import CameraService from '$lib/services/camera'

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
  })

  const replayEvents = () => {
    engine?.replayEvents()
  }
</script>

<div class="relative">
  <UI on:replay={replayEvents} />
  <div class="canvas" bind:this={canvasContainer} />
</div>

<style>
  .canvas {
    height: 844px;
    width: 390px;
    background-color: #000;
  }
</style>
