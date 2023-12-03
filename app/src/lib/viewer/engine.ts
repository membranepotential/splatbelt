import type { Viewer } from '$splats'
import { app } from '$lib/stores'
import { get } from 'svelte/store'
import { VIEWER_STATE } from '$lib/types'
import type { Shot } from '$lib/types'
import ShotsService from '$lib/services/shots'
import GestureService from '$lib/services/gesture'

const currentShotIdx = ShotsService.getCurrentShotIdx()

export class ViewerEngine {
  viewer: Viewer
  lastState: VIEWER_STATE

  loopTimer: null | ReturnType<typeof setInterval>
  duration: number = 0

  constructor(viewer: Viewer) {
    this.viewer = viewer
    this.lastState = VIEWER_STATE.FREE

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
  }

  handleStateUpdate(newState: VIEWER_STATE) {
    clearInterval(this.loopTimer!)

    switch (newState) {
      case VIEWER_STATE.FREE:
        break
      case VIEWER_STATE.RECORD:
        break
      case VIEWER_STATE.PLAY:
        const currentShot = get(ShotsService.getCurrentShot())
        this.playLoop(currentShot)
        break
    }
  }

  saveInitialPosition() {
    this.viewer?.controls?.saveState()
  }

  saveAndPlayShot() {
    const currentShot = get(ShotsService.getCurrentShot())
    currentShot.initialPosition = {
      target: this.viewer.controls!.target0.clone(),
      position: this.viewer.controls!.position0.clone(),
      zoom: this.viewer.controls!.zoom0,
    }

    this.playLoop(currentShot)
  }

  playLoop(shot: Shot) {
    // TODO: check initial position and reset
    // shot.initialPosition.target.copy(this.viewer.camera.target) // 0,0,0 anyway

    if (!shot.newCameraPosition) {
      throw new Error(
        'No new camera position defined for shot. How did this happen?'
      )
    }

    this.viewer.camera.zoom = shot.initialPosition.zoom
    this.viewer.camera.updateProjectionMatrix()

    GestureService.applyNewCameraPosition(shot.newCameraPosition, shot.duration)
    setTimeout(() => {
      // shot.initialPosition.position.copy(this.viewer.camera.position)
      this.viewer.controls?.reset()
    }, shot.duration + 200)

    this.loopTimer = setTimeout(
      this.playLoop.bind(this, shot),
      shot.duration + 3000
    )
  }
}
