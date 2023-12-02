import type { Viewer } from '$splats'
import { app, events, playerProgress } from '$lib/stores'
import { get } from 'svelte/store'
import { throttle } from 'lodash-es'
import { VIEWER_STATE } from '$lib/types'
import type { Shot } from '$lib/types'
import ShotsService from '$lib/services/shots'

const currentShotIdx = ShotsService.getCurrentShotIdx()
const shots = ShotsService.getShots()

// console.log(currentShot)
// $: console.log('Current shot is now: ', get(currentShot))
// $: console.log('Shots length is now: ', get(shots).length)

export class ViewerEngine {
  viewer: Viewer
  lastState: VIEWER_STATE

  static eventsToTrack = [
    'contextmenu',
    'keydown',
    'pointercancel',
    'pointerdown',
    'pointermove',
    'pointerup',
    'wheel',
  ]

  trackMouseMove: (e: PointerEvent) => void

  loopTimer: null | ReturnType<typeof setInterval>
  duration: number = 0

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.lastState = VIEWER_STATE.FREE

    this.trackMouseMove = throttle(this.trackEvent, 16, {
      leading: true,
      trailing: true,
    })

    this.loopTimer = null

    app.subscribe(({ VIEWER_STATE: currentState }) => {
      if (currentState !== this.lastState) {
        console.log('State changed from ', this.lastState, ' to ', currentState)
        this.lastState = currentState
        this.handleStateUpdate(currentState)
      }
    })

    currentShotIdx.subscribe(() => {
      this.resetForNewShot()
    })
  }

  resetForNewShot() {
    app.set({
      VIEWER_STATE: VIEWER_STATE.FREE,
    })
    this.viewer.controls?.reset()
    // events.set([])
  }

  loadShot(shot: Shot) {
    if (this.viewer.controls !== null) {
      this.viewer.controls.position0 = shot.initialPosition.position
      this.viewer.controls.target0 = shot.initialPosition.target
      this.viewer.controls.zoom0 = shot.initialPosition.zoom
      this.viewer.controls.reset()
    }
    events.set(shot.trace)
  }

  trackEvent(e: PointerEvent) {
    events.update((contents) => [
      ...contents,
      { timeStamp: e.timeStamp, x: e.clientX, y: e.clientY },
    ])
  }

  handleStateUpdate(newState: VIEWER_STATE) {
    clearInterval(this.loopTimer!)

    switch (newState) {
      case VIEWER_STATE.FREE:
        this.handleFreeState()
        break
      case VIEWER_STATE.RECORD:
        this.handleRecordState()
        break
      // case VIEWER_STATE.PLAY:
      //   this.handlePlayState()
      //   break
    }
  }

  handleRecordState() {
    this.saveInitialPosition()
    for (const eventType of ViewerEngine.eventsToTrack) {
      const fn =
        eventType === 'mousemove' ? this.trackMouseMove : this.trackEvent

      this.viewer.rootElement.addEventListener(eventType, fn)
    }

    this.viewer.rootElement.addEventListener(
      'pointerdown',
      this.saveInitialPosition
    )
  }

  handleFreeState() {
    for (const eventType of ViewerEngine.eventsToTrack) {
      const fn =
        eventType === 'mousemove' ? this.trackMouseMove : this.trackEvent

      this.viewer.rootElement.removeEventListener(eventType, fn)
    }

    this.viewer.rootElement.removeEventListener(
      'pointerdown',
      this.saveInitialPosition
    )
  }

  saveInitialPosition() {
    this.viewer.controls?.saveState()
  }

  saveAndPlayShot() {
    const currentShot = get(ShotsService.getCurrentShot())
    currentShot.initialPosition = {
      target: this.viewer.controls!.target0.clone(),
      position: this.viewer.controls!.position0.clone(),
      zoom: this.viewer.controls!.zoom0,
    }

    this.replayEvents()
  }

  replayEvents() {
    clearInterval(this.loopTimer!)
    get(app).VIEWER_STATE = VIEWER_STATE.PLAY
    let trace: Interaction[] = get(events)

    // viewer.controls?.setState(initialPosition)

    this.duration = trace[trace.length - 1].timeStamp - trace[0].timeStamp

    this.playLoop(trace)
    this.loopTimer = setInterval(
      this.playLoop.bind(this, trace),
      this.duration + 20000
    )
  }

  playLoop(trace: Interaction[]) {
    app.update(() => {
      return {
        VIEWER_STATE: VIEWER_STATE.PLAY,
      }
    })
    console.log('playLoop duration ', this.duration, ' events: ', trace.length)

    const { timeStamp: firstEventTimestamp } = trace[0]

    playerProgress.set({
      current: 0,
      total: this.duration,
    })
    this.viewer.controls?.reset()
    let loopStartTime = Date.now()
    let lastFrameTime = Date.now()

    // const mapOfPlayedEvents = new WeakMap()

    let eventsPlayed = 0
    const report = () => {
      console.log('Events played: ', eventsPlayed)
    }

    const playFrame = () => {
      // Check for different mode
      if (get(app).VIEWER_STATE !== VIEWER_STATE.PLAY) {
        return report()
      }

      // Check for loop done
      const currentOffset = Date.now() - loopStartTime
      if (currentOffset > this.duration) {
        return report()
      }

      const idealTime = loopStartTime + currentOffset

      /**
       * Find the element in the store that has the closest delta to the current offset
       */
      const closestEntry = trace.reduce((prev, curr) => {
        const currDelta = curr.timeStamp - firstEventTimestamp
        const prevDelta = prev.timeStamp - firstEventTimestamp

        const currDiff = Math.abs(currDelta - currentOffset)
        const prevDiff = Math.abs(prevDelta - currentOffset)

        return currDiff < prevDiff ? curr : prev
      })

      if (closestEntry) {
        // mapOfPlayedEvents.set(closestEntry, true)
        this.viewer.rootElement!.dispatchEvent(closestEntry)
        eventsPlayed++
      }

      const currentTime = Date.now()
      const timeSinceLastFrame = currentTime - lastFrameTime
      const timeToNextFrame = Math.max(0, 16 - timeSinceLastFrame)

      lastFrameTime = currentTime

      setTimeout(playFrame.bind(this), timeToNextFrame)

      // Do this when we have time
      requestAnimationFrame(() => {
        playerProgress.set({
          current: currentOffset,
          total: this.duration,
        })
      })
    }

    playFrame()
  }
}
