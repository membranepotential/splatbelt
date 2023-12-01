<script lang="ts">
  import { onMount } from 'svelte'
  import * as GaussianSplat3D from '$lib/splats'
  import type { PageData } from './$types'
  import UI from './components/UI.svelte'
  import { app, events, playerProgress } from '$lib/stores'
  import { initial, throttle } from 'lodash-es'
  import { Vector3 } from 'three'
  import { VIEWER_STATE } from '$lib/types'
  import type { EventWithDelta } from '$lib/types'

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
      lastViewerState = currentState
      handleStateUpdate(currentState)
    }
  })

  function saveInitialPosition() {
    events.set([])
    viewer.controls?.saveState()
  }
  const trackEvent = (e) => {
    events.update((contents) => [...contents, e])
  }
  const trackMouseMove = throttle(trackEvent, 16, {
    leading: true,
    trailing: true,
  })
  var loopTimer = null

  /**
   * TODO: WHEN USER TOUCHES AGAIN, MOVE TO FREE
   * @param newState
   */
  function handleStateUpdate(newState: VIEWER_STATE) {
    if (newState === VIEWER_STATE.RECORD) {
      clearInterval(loopTimer)

      saveInitialPosition()
      for (const eventType of eventsToTrack) {
        const fn = eventType === 'mousemove' ? trackMouseMove : trackEvent

        viewer.rootElement.addEventListener(eventType, fn)
      }

      viewer.rootElement.addEventListener('pointerdown', saveInitialPosition)
    } else if (newState === VIEWER_STATE.FREE) {
      clearInterval(loopTimer)
      for (const eventType of eventsToTrack) {
        const fn = eventType === 'mousemove' ? trackMouseMove : trackEvent

        viewer.rootElement.removeEventListener(eventType, fn)
      }

      viewer.rootElement.removeEventListener('pointerdown', saveInitialPosition)
    }
  }

  function replayEvents() {
    $app.VIEWER_STATE = VIEWER_STATE.PLAY
    function get__store(store: any): Event[] {
      let $val
      store.subscribe(($) => ($val = [...$]))()
      return $val as unknown as Event[]
    }

    let storeContent: Event[] = get__store(events)

    // viewer.controls?.setState(initialPosition)

    const { target, timeStamp: firstEventTimestamp } = storeContent[0]

    const duration =
      storeContent[storeContent.length - 1].timeStamp -
      storeContent[0].timeStamp

    function playLoop() {
      console.log(
        'playLoop duration ',
        duration,
        ' events: ',
        storeContent.length
      )

      playerProgress.set({
        current: 0,
        total: duration,
      })
      viewer.controls?.reset()
      let loopStartTime = Date.now()
      let lastFrameTime = Date.now()

      // const mapOfPlayedEvents = new WeakMap()

      let eventsPlayed = 0
      const report = () => {
        console.log('Events played: ', eventsPlayed)
      }

      function playFrame() {
        // Check for different mode
        if ($app.VIEWER_STATE !== VIEWER_STATE.PLAY) {
          return report()
        }

        // Check for loop done
        const currentOffset = Date.now() - loopStartTime
        if (currentOffset > duration) {
          return report()
        }

        const idealTime = loopStartTime + currentOffset

        /**
         * Find the element in the store that has the closest delta to the current offset
         */
        const closestEntry = storeContent.reduce((prev, curr) => {
          const currDelta = curr.timeStamp - firstEventTimestamp
          const prevDelta = prev.timeStamp - firstEventTimestamp

          const currDiff = Math.abs(currDelta - currentOffset)
          const prevDiff = Math.abs(prevDelta - currentOffset)

          return currDiff < prevDiff ? curr : prev
        })

        if (closestEntry) {
          // mapOfPlayedEvents.set(closestEntry, true)
          target.dispatchEvent(closestEntry)
          eventsPlayed++
        }

        const currentTime = Date.now()
        const timeSinceLastFrame = currentTime - lastFrameTime
        const timeToNextFrame = Math.max(0, 16 - timeSinceLastFrame)

        lastFrameTime = currentTime

        setTimeout(playFrame, timeToNextFrame)

        // Do this when we have time
        requestAnimationFrame(() => {
          playerProgress.set({
            current: currentOffset,
            total: duration,
          })
        })
      }

      playFrame()
    }
    playLoop()
    loopTimer = setInterval(playLoop, duration + 2000)
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
