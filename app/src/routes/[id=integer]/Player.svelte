<script lang="ts">
  import { tweened, type Tweened } from 'svelte/motion'
  import { quadInOut } from 'svelte/easing'
  import { error } from '@sveltejs/kit'
  import { onDestroy, onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import type Viewer from '$lib/services/viewer'
  import ShotList from '$lib/components/ShotList.svelte'
  import { SplineCurve } from 'three'
  import type { Shot } from '$lib/types'
  import {
    composeMotion,
    getMovementConfig,
    type CameraSetting,
  } from '$lib/stores/motions'

  /* Plays the shot and offers settings to modify the shot */

  export let viewer: Viewer
  export let shots: Shot[] | undefined
  export let shotIdx: number | undefined

  $: shot = shots[shotIdx]
  $: if (!shot) {
    throw error(400, 'Shot not found')
  }

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

  onMount(() => loop())

  let aborting = false

  let unsubsscribe: () => void

  function loop() {
    console.log('tween started')
    viewer.moveTo(initial)
    tween = tweened(0, {
      delay: 500,
      duration: 1200,
      easing: quadInOut,
    })
    unsubsscribe = tween.subscribe((t) => {
      if (aborting) {
        return
      }
      const delta = curve.getPointAt(t).sub(curve.points[0])
      viewer.moveTo(motion(initial, delta))
    })
    tween.set(1).finally(() => {
      console.log('tween done')
      if (!aborting) {
        setTimeout(loop, 1000)
      } else {
        unsubsscribe()
        aborting = false
      }
    })
  }

  onDestroy(() => {
    unsubsscribe && unsubsscribe()
    aborting = true
  })
</script>

<div class="z-30">
  <ShotList
    progress={$tween * 100 || 0.0}
    on:changeShot={(event) => {
      goto(`?state=PLAY&shot=${event.detail.to}`)
    }}
  />
</div>
