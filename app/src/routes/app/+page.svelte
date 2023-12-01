<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'

  export let data: PageData
  let canvas: HTMLDivElement
  let viewer: GaussianSplat3D.Viewer

  onMount(async () => {
    viewer = new GaussianSplat3D.Viewer(
      canvas, // rootElement
      [0, -1, -0.6], // initialCameraPos
      [-1, -4, 6], // initialCameraLookAt
      [0, 4, -0], // splatAlphaRemovalThreshold
      20 //
    )
    viewer.init()

    await viewer.loadBlob(data.pointCloud)
    viewer.start()
  })
</script>

<div class="relative">
  <UI />
  <div class="canvas" bind:this={canvas} />
</div>

<style>
  .canvas {
    height: 844px;
    width: 390px;
    background-color: #000;
  }
</style>
