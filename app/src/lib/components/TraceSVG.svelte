<script lang="ts">
  import type { Vector2 } from 'three'

  export let trace: Vector2[]
  $: path = toSvgPath(trace)
  // $: console.log('path is now: ', path)

  /* Paints the shot as a SVG trace for visual feedback */
  function toSvgPath(points: Vector2[]) {
    if (!points) return ''

    return points.reduce((acc, point, idx) => {
      if (idx === 0) {
        return `M ${point.x} ${point.y}`
      }

      return `${acc} L ${point.x} ${point.y}`
    }, '')
  }
</script>

<svg class="h-full w-full" {...$$restProps}>
  <path d={path} />
</svg>
