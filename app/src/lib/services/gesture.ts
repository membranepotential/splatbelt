import { get } from 'svelte/store'
import { app, controls } from '$lib/stores'
import type { Viewer } from '$splats'
import { throttle } from 'lodash-es'
import * as TWEEN from '@tweenjs/tween.js'
import type { PerspectiveCamera } from 'three'
import { Spherical, Vector3 } from 'three'
import { VIEWER_STATE, CAMERA_RECORDING_MODE } from '$lib/types'

type XYZ = {
  x: number
  y: number
  z: number
}

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
  handleEventMoveThrottled: (event: Event) => void
  latestEvents: Event[]

  viewer: Viewer | null
  camera: PerspectiveCamera | null
  tween: TWEEN.Tween<any> | null

  constructor() {
    this.handleEventMoveThrottled = throttle(this.handleEvent.bind(this), 100, {
      leading: true,
      trailing: true,
    })

    this.handleEvent = this.handleEvent.bind(this)
    this.handleEventDown = this.handleEventDown.bind(this)
    this.handleEventUp = this.handleEventUp.bind(this)

    this.latestEvents = []
    this.viewer = null
    this.camera = null
    this.tween = null

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

    console.log('zooming')
    var scale = axis === 'x' ? directionX : directionY

    const _zoom = zoom + 0.2 * scale

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
    spherical.theta += directionX / 50
    spherical.phi += directionY / 150

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
    const currentSettings = get(controls)

    const [first, second] = this.latestEvents
    const directionX = second.clientX - first.clientX
    // console.log('x dir', directionX)

    const directionY = first.clientY - second.clientY

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
      return Object.entries(get(controls))
        .filter(([, mode]) => mode === current)
        .reduce((prevI, [currentAxis, currentMode]) => {
          const intermediateResults = this.applyTransformation(
            prevI.coords,
            prevI.zoom,
            {
              hasAppliedDolly: prevI.hasAppliedDolly,
              hasAppliedZoom: prevI.hasAppliedZoom,
              hasAppliedPan: prevI.hasAppliedPan,
              axis: currentAxis,
              mode: currentMode,
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

  handleEvent(event: Event) {
    // console.log(event)
    if (this.latestEvents.length > 1 && !this.tween) {
      const [first, second] = this.latestEvents

      const camera: PerspectiveCamera = this.camera!
      const { coords, zoom, hasAppliedDolly, hasAppliedZoom, hasAppliedPan } =
        this.calculateNewCameraPosition([first, second])
      // console.log(coords)
      // camera.position.set(coords.x + 100, coords.y, coords.z)
      const duration = 1200

      console.log('hasAppliedDolly', hasAppliedDolly)
      console.log('hasAppliedPan', hasAppliedPan)
      console.log('hasAppliedZoom', hasAppliedZoom)

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
      this.tween = new TWEEN.Tween(from)
        .to(to, duration)
        .easing(TWEEN.Easing.Quadratic.InOut) // Add this line for a bezier curve effect
        .onUpdate(() => {
          if (hasAppliedZoom) {
            camera.zoom = from.zoom
          }
          if (hasAppliedPan || hasAppliedDolly) {
            camera.position.set(from.x, from.y, from.z)
          }
        })

      this.tween.start().onComplete(() => {
        console.log('Tween complete')
        if (hasAppliedZoom) {
          camera.updateProjectionMatrix()
        }

        this.tween = null
        this.latestEvents = []

        app.set({ VIEWER_STATE: VIEWER_STATE.PLAY })
      })
    }
    this.latestEvents.push(event)
  }

  handleEventUp(event: Event) {
    console.log('gestures > handleKeyUp')
  }
  handleEventDown(event: Event) {
    console.log('gestures > handleKeyDown')
  }

  reset() {
    if (this.tween) {
      this.tween.stop()
      this.tween = null
      this.latestEvents
    }
  }
}

const service = new GestureService()
export default service
