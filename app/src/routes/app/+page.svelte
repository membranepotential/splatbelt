<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { app, events } from '$lib/stores'
  import { initial, throttle } from 'lodash-es'
  import { Vector3 } from 'three'
  import { VIEWER_STATE } from '$lib/types'

  export let data: PageData
  let canvasContainer: HTMLDivElement
  let viewer: GaussianSplat3D.Viewer

  let lastEvent: PointerEvent | null = null
  events.subscribe((e) => {
    lastEvent = e.length > 0 ? e[e.length - 1] : null
  })

  var renderer = null
  let state = 'record'
  var initialPosition = null

  const eventsToTrack = [
    'contextmenu',
    'keydown',
    'pointercancel',
    'pointerdown',
    'pointermove',
    'pointerup',
    'wheel',
  ]

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

    renderer = viewer.renderer.domElement

    const trackEvent = (e) => {
      events.update((contents) => [
        ...contents,
        {
          type: e.type,
          event: e,
        },
      ])
    }
    const trackMouseMove = throttle(trackEvent, 16, {
      leading: true,
      trailing: true,
    })

    for (const eventType of eventsToTrack) {
      const fn = eventType === 'mousemove' ? trackMouseMove : trackEvent

      viewer.rootElement.addEventListener(eventType, fn)
    }

    viewer.rootElement.addEventListener('pointerdown', () => {
      events.set([])
      console.log('setting initial position')
      // initialPosition = viewer.controls.getState()\
      viewer.controls = {
        ...viewer.controls,
        target0: new Vector3().copy(viewer.controls.target),
        position0: new Vector3().copy(viewer.controls.object.position),
        zoom0: viewer.controls?.object.zoom,
      }
    })

    // viewer.rootElement.addEventListener('pointermove', (e) => {
    //   if (state === 'play') return
    //   if (initialPosition === null) {
    //     initialPosition = viewer.controls.getState()
    //   }

    //   events.update((contents) => [...contents, e])

    //   console.log(lastEvent)
    // })
  })

  let lastViewerState = VIEWER_STATE.FREE
  app.subscribe(({ VIEWER_STATE: currentState }) => {
    if (currentState !== lastViewerState) {
      console.log('State changed from ', lastViewerState, ' to ', currentState)
    }
    lastViewerState = currentState
  })

  function replayEvents() {
    state = 'play'
    console.log('State is now Play')
    function get__store(store) {
      let $val
      store.subscribe(($) => ($val = $))()
      return $val
    }

    const storeContent = get__store(events)

    // viewer.controls?.setState(initialPosition)
    viewer.controls?.reset()

    const eventTarget = storeContent[0].event.target
    let index = 0

    function next() {
      console.log(index)
      if (!storeContent[index++]) {
        return null
      }
      const { type, event } = storeContent[index]

      console.log('dispatching ', type)
      eventTarget.dispatchEvent(event)
      setTimeout(next, 16)
    }
    setTimeout(next, 16)
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
