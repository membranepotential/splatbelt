<script lang="ts">
  import type Viewer from '$lib/services/viewer'
  import ShotList from '$lib/components/ShotList.svelte'
  import type { Shot } from '$lib/schemas/shot'
  import { SplineCurve } from 'three'
  import {
    composeMotion,
    getMovementConfig,
    type CameraSetting,
  } from '$lib/stores/motions'
  import { tweened, type Tweened } from 'svelte/motion'
  import { quadInOut } from 'svelte/easing'
  import { goto } from '$app/navigation'
  import { onDestroy } from 'svelte'

  /* Plays the shot and offers settings to modify the shot */

  export let viewer: Viewer
  export let shots: Shot[]
  export let shotIdx: number

  $: shot = shots[shotIdx]
  $: motion = composeMotion(
    {
      ...getMovementConfig(shot.motion.x.movement, 'x'),
      scale: shot.motion.x.scale,
    },
    {
      ...getMovementConfig(shot.motion.y.movement, 'y'),
      scale: shot.motion.y.scale,
    }
  )

  let initial: CameraSetting
  $: if (viewer) {
    initial = { camera: viewer.camera, target: viewer.target }
    initial.camera.position.copy(shot.initial.camera.position)
    initial.camera.zoom = shot.initial.camera.zoom
    initial.target.copy(shot.initial.target)
    viewer.moveTo(initial)
    viewer.saveState()
  }
  $: curve = new SplineCurve(shot.points)

  let tween: Tweened<number>
  async function startTween() {
    tween = tweened(0, {
      delay: 500,
      duration: 12000,
      easing: quadInOut,
    })
    const unsubsscribe = tween.subscribe((t) => {
      const delta = curve.getPointAt(t).sub(curve.points[0])
      viewer.moveTo(motion(initial, delta))
    })
    await tween.set(1).finally(() => unsubsscribe())
  }

  async function loopTween() {
    let run = true
    while (run) {
      startTween()
    }

    return () => {
      run = false
    }
  }

  let unsubscribe: (() => void) | undefined
  $: if (shot && viewer && unsubscribe) {
    unsubscribe = loopTween()
  }

  onDestroy(() => {
    loop = undefined
  })
</script>

<div class="z-30">
  <ShotList
    {shots}
    {shotIdx}
    progress={$tween * 100 || 0.0}
    on:changeShot={(event) => {
      goto(`?state=play&shot=${event.detail.to}`)
    }}
  />
</div>
