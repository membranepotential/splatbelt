<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats'
  import type { PageData } from './$types'
  import { ModelConfig } from '$lib/schemas'

  export let data: PageData
  export const config: ModelConfig = ModelConfig.parse({})

  let canvas: HTMLDivElement
  let viewer: GaussianSplat3D.Viewer

  onMount(async () => {
    viewer = new GaussianSplat3D.Viewer(
      canvas,
      [0, -1, -0.6],
      [-1, -4, 6],
      [0, 4, -0],
      20
    )
    viewer.init()

    await viewer.loadBlob(data.pointCloud)
    viewer.start()
  })
</script>

<div class="canvas w-full" bind:this={canvas} />

<style>
  .canvas {
    height: 800px;
    background-color: #000;
  }
</style>
