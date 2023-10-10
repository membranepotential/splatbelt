<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats/gaussian-splat-3d.module'

  onMount(() => {
    const viewer = new GaussianSplat3D.Viewer(
      document.getElementById('page-canvas')!,
      [0, -1, -0.6],
      [-1, -4, 6],
      [0, 4, -0],
      20
    )
    viewer.init()
    viewer.loadFile('/models/truck.splat').then(() => {
      viewer.start()
    })
  })
</script>

<div class="canvas" id="page-canvas">Truck</div>

<style>
  .canvas {
    width: 100%;
    height: 800px;
    background-color: #000;
  }
</style>
