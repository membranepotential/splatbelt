<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { ViewerEngine } from '$lib/viewer/engine'

  export let data: PageData
  let canvasContainer: HTMLDivElement
  let viewer: GaussianSplat3D.Viewer

  let lastEvent: PointerEvent | null = null

  let engine = null

  onMount(async () => {
    viewer = new GaussianSplat3D.Viewer(
      canvasContainer, // rootElement
      [0, -1, -0.6], // initialCameraPos
      [-1, -4, 6], // initialCameraLookAt
      [0, 4, -0], // splatAlphaRemovalThreshold
      20 //
    )
    viewer.init()

    await viewer.loadBlob(data.pointCloud)
    viewer.start()

    engine = new ViewerEngine(viewer)
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
