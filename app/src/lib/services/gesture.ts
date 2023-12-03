import { get } from 'svelte/store'
import { app, controls, playerProgress } from '$lib/stores'
import type { Viewer } from '$splats'
import * as TWEEN from '@tweenjs/tween.js'
import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import { VIEWER_STATE, CAMERA_RECORDING_MODE } from '$lib/types'
import type { MotionDestination, XYZ } from '$lib/types'
import ShotsService from './shots'

type TransformationParams = {
  axis: string
  mode: CAMERA_RECORDING_MODE
  directionX: number
  directionY: number
  camera: PerspectiveCamera
  viewer: Viewer
  hasAppliedDolly?: boolean
  hasAppliedZoom?: boolean
  hasAppliedPan?: boolean
}

const cameraToXYZ = (camera: PerspectiveCamera): XYZ => ({
  x: camera.position.x,
  y: camera.position.y,
  z: camera.position.z,
})

class GestureService {
  latestEvents: Event[]

  viewer: Viewer | null
  camera: PerspectiveCamera | null
  cameraAtBeginning: PerspectiveCamera | null
  tween: TWEEN.Tween<any> | null

  constructor() {
    this.handleEventMove = this.handleEventMove.bind(this)
    this.handleEventDown = this.handleEventDown.bind(this)
    this.handleEventUp = this.handleEventUp.bind(this)

    this.latestEvents = []
    this.viewer = null
    this.camera = null
    this.tween = null
    this.cameraAtBeginning = null

    app.subscribe((state) => {
      if (state.VIEWER_STATE === VIEWER_STATE.RECORD) {
        this.reset()
      }
    })
  }

  link(viewer: Viewer) {
    this.viewer = viewer
    this.camera = viewer.camera
  }

  applyTransformation(coords: XYZ, zoom: number, params: TransformationParams) {
    const { mode } = params

    if (!params.camera.position) {
      throw new Error("Can't apply transformation without camera position")
    }

    switch (mode) {
      case 'DOLLY':
        return this.applyDollyTransform(coords, zoom, params)
      case 'ZOOM':
        return this.applyZoomTransform(coords, zoom, params)
      case 'PAN':
        return this.applyPanTransform(coords, zoom, params)
      default:
        throw new Error('Unsupported mode: ' + mode)
    }
  }

  /**
   *
   * Dolly is a type of zoom and goes traight back and forth.
   * The axis doesn't matter, we just want the distance
   * @returns
   */
  applyDollyTransform(coords: XYZ, zoom: number, params: TransformationParams) {
    const { axis, directionX, directionY, viewer, camera } = params

    const _camera = camera.clone()

    var scale = axis === 'x' ? directionX : directionY

    var dir = new Vector3()
    dir.subVectors(viewer!.controls!.target, camera.position).normalize()

    // console.log('going to target at ', viewer!.controls!.target)
    // console.log('dolly zooming by ', scale, 'on the vector ', dir)

    // Zoom in or out
    var dollyZoom = dir.multiplyScalar(scale * 1.25)
    _camera.position.add(dollyZoom)

    coords.x = _camera.position.x
    coords.y = _camera.position.y
    coords.z = _camera.position.z

    return { zoom, coords, hasAppliedDolly: true }
  }

  applyZoomTransform(coords: XYZ, zoom: number, params: TransformationParams) {
    const { axis, directionX, directionY } = params

    var scale = axis === 'x' ? directionX : directionY

    const _zoom = zoom + 0.6 * scale

    return { zoom: _zoom, coords, hasAppliedZoom: true }
  }

  applyPanTransform(coords: XYZ, zoom: number, params: TransformationParams) {
    const { axis, directionX, directionY, viewer, camera } = params
    if (params.hasAppliedPan) {
      return { zoom, coords, hasAppliedPan: true }
    }
    const _camera = camera.clone()
    const _coods = cameraToXYZ(_camera)

    function toSpherical(cartesian: any) {
      var radius = cartesian.length()
      var phi = Math.acos(cartesian.y / radius) // Angle from the Y-axis
      var theta = Math.atan2(cartesian.x, cartesian.z) // Angle from the Z-axis in XZ plane

      return { radius, phi, theta }
    }

    // Function to convert from Spherical to Cartesian coordinates
    function toCartesian(spherical: any) {
      var x =
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
      var y = spherical.radius * Math.cos(spherical.phi)
      var z =
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)

      return new Vector3(x, y, z)
    }

    var spherical = toSpherical(_camera.position)

    console.log(spherical.theta, spherical.phi)
    // Adjust phi and theta for panning
    spherical.theta += directionX * 2
    spherical.phi += directionY / 20

    // Ensure phi is within bounds to prevent flip
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

    // Convert back to Cartesian coordinates
    _camera.position.copy(toCartesian(spherical))

    coords.x = _camera.position.x
    coords.y = _camera.position.y
    coords.z = _camera.position.z

    return { zoom, coords, hasAppliedPan: true }
  }

  calculateNewCameraPosition(events: Event[]) {
    const [a, b] = this.latestEvents
    const directionX = b.clientX - a.clientX
    // console.log('x dir', directionX)

    const directionY = a.clientY - b.clientY

    const orderOfApplication = [
      CAMERA_RECORDING_MODE.PAN,
      CAMERA_RECORDING_MODE.DOLLY,
      CAMERA_RECORDING_MODE.ZOOM,
    ]

    let startCoords = cameraToXYZ(this.camera!)

    let state = {
      coords: cameraToXYZ(this.camera!),
      zoom: this.camera!.zoom,
      hasAppliedDolly: false,
      hasAppliedZoom: false,
      hasAppliedPan: false,
    }

    console.table([...Object.values(state.coords), state.zoom])
    let operationCounter = 0
    const results = orderOfApplication.reduce((prev, current) => {
      return ['x', 'y']
        .map((key) => [key, get(controls)[key]])
        .filter(([key, mode]) => mode === current)
        .reduce((prevI, [currentAxis, currentMode]) => {
          const intermediateResults = this.applyTransformation(
            prevI.coords,
            prevI.zoom,
            {
              hasAppliedDolly: prevI.hasAppliedDolly,
              hasAppliedZoom: prevI.hasAppliedZoom,
              hasAppliedPan: prevI.hasAppliedPan,
              axis: currentAxis,
              mode: currentMode as CAMERA_RECORDING_MODE,
              directionX,
              directionY,
              camera: this.camera!,
              viewer: this.viewer!,
            }
          )

          console.log('### APPLIED ', currentMode, ' ON ', currentAxis, ' ###')
          console.table([
            ...Object.values(intermediateResults.coords),
            intermediateResults.zoom,
          ])

          operationCounter++

          return {
            ...prevI,
            ...intermediateResults,
          }
        }, prev)
    }, state)

    console.log('### DONE WITH ', operationCounter, ' THINGS TO DO ###')

    results.coords.x = Math.min(results.coords.x, 80)
    results.coords.y = Math.min(results.coords.y, 80)
    results.coords.z = Math.min(results.coords.z, 80)
    results.zoom = Math.min(Math.max(results.zoom, 0), 30)

    return results
  }

  applyNewCameraPosition(
    newCameraPosition: MotionDestination,
    duration: number
  ) {
    const { coords, zoom, hasAppliedDolly, hasAppliedZoom, hasAppliedPan } =
      newCameraPosition
    const camera: PerspectiveCamera = this.camera!

    const from = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      zoom: camera.zoom,
    }
    const to = {
      x: coords.x,
      y: coords.y,
      z: coords.z,
      zoom,
    }
    // console.table(from)
    // console.table(to)

    // console.log(from.zoom, coords.zoom)

    // console.log(from, coords)
    const startTime = new Date()
    this.tween = new TWEEN.Tween(from)
      .to(to, duration)
      .easing(TWEEN.Easing.Quadratic.InOut) // Add this line for a bezier curve effect
      .onUpdate(function () {
        let time = new Date()

        playerProgress.set({
          current: +new Date() - startTime.getTime(),
          total: duration,
        })

        if (hasAppliedPan || hasAppliedDolly) {
          camera.position.set(from.x, from.y, from.z)
        }
      })

    this.tween.start().onComplete(() => {
      console.log('Tween complete')

      if (hasAppliedZoom) {
        camera.zoom = from.zoom
        camera.updateProjectionMatrix()
      }
      const currentState = get(app).VIEWER_STATE

      if (currentState === VIEWER_STATE.RECORD) {
        ShotsService.updateCurrentShot({
          duration: duration,
          initialPosition: {
            target: this.viewer!.controls!.target0.clone(),
            position: this.cameraAtBeginning!.position.clone(),
            zoom: this.cameraAtBeginning!.zoom,
          },
          newCameraPosition: newCameraPosition,
        })

        this.latestEvents = []
        this.cameraAtBeginning = null
        app.set({ VIEWER_STATE: VIEWER_STATE.PLAY })
      }

      if (currentState === VIEWER_STATE.PLAY) {
        playerProgress.set({
          current: 0,
          total: duration,
        })
      }

      this.tween = null
    })
  }

  handleEventMove(event: Event) {
    this.latestEvents.push(event)

    // const timeElapsed =
    //   this.latestEvents[this.latestEvents.length - 1].timeStamp -
    //   this.latestEvents[0].timeStamp
    // console.log(timeElapsed)

    // /    if (timeElapsed > 200 && !this.tween) {
    if (this.latestEvents.length > 4 && !this.tween) {
      const first = this.latestEvents[0]
      const fourth = this.latestEvents[3]

      const { coords, zoom, hasAppliedDolly, hasAppliedZoom, hasAppliedPan } =
        this.calculateNewCameraPosition([first, fourth])
      this.applyNewCameraPosition(
        {
          coords,
          zoom,
          hasAppliedDolly,
          hasAppliedZoom,
          hasAppliedPan,
        },
        1200
      )
    }
  }

  handleEventUp(event: Event) {
    console.log('gestures > handleKeyUp')
    document
      .getElementById('canvaswrap')!
      .releasePointerCapture(event.pointerId)
  }
  handleEventDown(event: Event) {
    console.log('gestures > handleKeyDown')
    document.getElementById('canvaswrap')!.setPointerCapture(event.pointerId)
    this.cameraAtBeginning = this.camera!.clone()
    this.latestEvents = []
  }

  reset() {
    if (this.tween) {
      this.tween.stop()
      this.tween = null
      this.latestEvents = []
    }
  }
}

const service = new GestureService()
export default service
