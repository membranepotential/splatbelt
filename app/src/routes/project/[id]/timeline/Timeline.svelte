<script lang="ts">
  import { Canvas } from '@threlte/core';
  import Scene from './Scene.svelte';

  /**
   * Example from https://github.com/iansamz/threlte6-spinning-ball/tree/main
   */
</script>

<div class="sphere-canvas">
  <Canvas>
    <Scene />
  </Canvas>
</div>

<style>
  .sphere-canvas {
    width: 100%;
    height: 600px;
  }
</style>
