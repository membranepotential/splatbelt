<script lang="ts">
  import { tweened, type Tweened } from 'svelte/motion'
  import { quadInOut } from 'svelte/easing'
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
  import { controls } from '$lib/stores'
  import { writable } from 'svelte/store'

  /* Plays the shot and offers settings to modify the shot */

  export let viewer: Viewer
  export let shots: Shot[]
  export let shotIdx: number

  $: shot = shots[shotIdx]
  let motion: ReturnType<typeof composeMotion>
  let curve: SplineCurve

  let isCancelling = false

  let initial: CameraSetting

  let tween: Tweened<number>

  let unsubsscribe: () => void
  let timer: ReturnType<typeof setTimeout> | null

  let progress = writable<number>()

  onMount(() => {
    loop()
  })

  $: if (!shot) {
    console.log('no more shot, cancelling playback')
    cancelPlayback()
    isCancelling = false
  } else {
    curve = new SplineCurve(shot.points)

    console.log('config: ', shot.motion)

    motion = composeMotion(
      {
        ...getMovementConfig(shot.motion.x.movement, 'x'),
        scale: shot.motion.x.scale,
      },
      {
        ...getMovementConfig(shot.motion.y.movement, 'y'),
        scale: shot.motion.y.scale,
      }
    )

    initial = { camera: viewer.camera, target: viewer.target }
    initial.camera.position.copy(shot.initial.camera.position)
    initial.camera.zoom = shot.initial.camera.zoom
    initial.target.copy(shot.initial.target)
    viewer.moveTo(initial)
    viewer.saveState()
  }

  function cancelPlayback() {
    unsubsscribe && unsubsscribe()
    timer && clearTimeout(timer)
    isCancelling = true
  }

  function loop() {
    if (isCancelling) {
      return
    }
    viewer.moveTo(initial)
    tween = tweened(0, {
      delay: 500,
      duration: shot.duration * (1 / $controls.speedFactor),
      easing: quadInOut,
    })
    progress.set(0)
    unsubsscribe = tween.subscribe((t) => {
      if (isCancelling) {
        return unsubsscribe()
      }
      const delta = curve.getPointAt(t).sub(curve.points[0])
      console.log('initial: ', initial)
      console.log('delta: ', delta)
      viewer.moveTo(motion(initial, delta))
      requestAnimationFrame(() => {
        progress.set(t)
      })
    })

    tween.set(1).finally(() => {
      progress.set(0)
      if (!isCancelling) {
        timer = setTimeout(loop, 1000)
      } else {
        cancelPlayback()
      }
    })
  }

  onDestroy(() => {
    cancelPlayback()
  })
</script>

<div class="z-30">
  <ShotList
    {shots}
    {shotIdx}
    {progress}
    on:changeShot={(event) => {
      goto(`?state=PLAY&shot=${event.detail.to}`)
    }}
    on:newShot={() => {
      goto(`?state=FREE&shot=${shotIdx + 1}`)
    }}
  />
</div>
