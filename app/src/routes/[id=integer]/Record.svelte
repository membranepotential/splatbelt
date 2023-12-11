<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { Vector2 } from 'three'
  import { curve, controls, composedMotion } from '$lib/stores'
  import type { CameraSetting } from '$lib/stores/motions'
  import type Viewer from '$lib/services/viewer'
  import { DEFAULT_SCALES, type Shot } from '$lib/schemas/shot'

  /* Records a swipe gesture into a shot, paints a trace and controls the camera */

  export let viewer: Viewer
  export let shot: Shot | undefined

  let initial: CameraSetting | undefined

  $: if (viewer) initial = viewer.saveState()
  $: if (initial && shot) {
    curve.setShot(shot.points)

    initial.camera.position.copy(shot.initial.camera.position)
    initial.camera.zoom = shot.initial.camera.zoom
    initial.target.copy(shot.initial.target)
    viewer.moveTo(initial)
    viewer.saveState()
  }

  let canvasWrapper: HTMLDivElement

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

  let unsubscribe = curve.subscribe((points) => {
    if (initial && points && points.length > 2) {
      const delta = new Vector2().subVectors(points.slice(-1)[0], points[0])
      viewer.moveTo($composedMotion(initial, delta))
    }
  })

  onDestroy(unsubscribe)

  const dispatch = createEventDispatcher<{
    shotRecorded: { shot: Shot }
  }>()

  function handleEventMove(event: PointerEvent) {
    curve.addEvent(event)
  }

  function handleEventDown(event: PointerEvent) {
    canvasWrapper.setPointerCapture(event.pointerId)
    viewer.reset()
    curve.reset()
  }

  function handleEventUp(event: PointerEvent) {
    canvasWrapper.releasePointerCapture(event.pointerId)

    if (!initial) return

    const shot = {
      motion: {
        x: { movement: $controls.x, scale: DEFAULT_SCALES[$controls.x].x },
        y: { movement: $controls.y, scale: DEFAULT_SCALES[$controls.y].y },
      },
      initial: {
        camera: {
          position: initial.camera.position,
          zoom: initial.camera.zoom,
        },
        target: initial.target,
      },
      duration: $controls.duration,
      points: $curve,
    }

    dispatch('shotRecorded', { shot })
  }
</script>

<div
  id="canvaswrap"
  class="canvaswrap absolute inset-0 z-20 touch-none"
  bind:this={canvasWrapper}
  on:pointermove={handleEventMove}
  on:pointerdown={handleEventDown}
  on:pointerup={handleEventUp}
>
  <svg id="gesturesvg" class="h-full w-full">
    <path
      d={toSvgPath($curve)}
      fill="none"
      stroke="white"
      stroke-width="12px"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</div>
