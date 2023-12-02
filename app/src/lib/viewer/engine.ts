import type { Viewer } from '$lib/splats'
import { app, events, playerProgress } from '$lib/stores'
import { get } from 'svelte/store'
import { throttle } from 'lodash-es'
import { VIEWER_STATE } from '$lib/types'
import type { Shot } from '$lib/types'

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

  trackMouseMove: (e: Event) => void

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
  }

  loadShot(shot: Shot) {
    this.viewer.controls?.setState(shot.initialPosition)
    events.set(shot.events)
  }

  trackEvent(e: Event) {
    events.update((contents) => [...contents, e])
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
    events.set([])
    this.viewer.controls?.saveState()
  }

  replayEvents() {
    clearInterval(this.loopTimer!)
    get(app).VIEWER_STATE = VIEWER_STATE.PLAY
    let recordedEvents: Event[] = get(events)

    // viewer.controls?.setState(initialPosition)

    this.duration =
      recordedEvents[recordedEvents.length - 1].timeStamp -
      recordedEvents[0].timeStamp

    this.playLoop(recordedEvents)
    this.loopTimer = setInterval(
      this.playLoop.bind(this, recordedEvents),
      this.duration + 20000
    )
  }

  playLoop(recordedEvents: Event[]) {
    app.update(() => {
      return {
        VIEWER_STATE: VIEWER_STATE.PLAY,
      }
    })
    console.log(
      'playLoop duration ',
      this.duration,
      ' events: ',
      recordedEvents.length
    )

    const { target, timeStamp: firstEventTimestamp } = recordedEvents[0]

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
      const closestEntry = recordedEvents.reduce((prev, curr) => {
        const currDelta = curr.timeStamp - firstEventTimestamp
        const prevDelta = prev.timeStamp - firstEventTimestamp

        const currDiff = Math.abs(currDelta - currentOffset)
        const prevDiff = Math.abs(prevDelta - currentOffset)

        return currDiff < prevDiff ? curr : prev
      })

      if (closestEntry) {
        // mapOfPlayedEvents.set(closestEntry, true)
        target!.dispatchEvent(closestEntry)
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
