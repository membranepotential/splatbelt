import { get } from 'svelte/store'
import { app, controls } from '$lib/stores'
import type { Viewer } from '$lib/splats'
import { VIEWER_STATE } from '$lib/types'
import { throttle } from 'lodash-es'
import * as TWEEN from '@tweenjs/tween.js'
import type { PerspectiveCamera } from 'three'
import { Vector3 } from 'three'

type XZY = {
  x: number
  y: number
  z: number
}
class GestureService {
  handleEventMoveThrottled: (event: Event) => void
  latestEvents: Event[]
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
    this.camera = null
    this.tween = null
  }

  link(viewer: Viewer) {
    this.viewer = viewer
    this.camera = viewer.camera
  }

  calculateNewCameraPosition(events: Event[]) {
    const currentSettings = get(controls)

    const [first, second] = this.latestEvents
    const directionX = second.clientX - first.clientX
    // console.log('x dir', directionX)

    const directionY = first.clientY - second.clientY
    // console.log('y dir', directionY)

    // console.log('Starting tween')

    const xAbs = Math.abs(directionX)
    const yAbs = Math.abs(directionY)
    const dominantDirection = xAbs > yAbs ? 'x' : 'y'

    // console.log('dominantDirection', dominantDirection)

    const MODE = currentSettings[dominantDirection]
    // console.log('MODE', MODE)

    const camera = this.camera?.clone()!
    const coords = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      zoom: camera.zoom,
    }
    var zoom = camera.zoom

    let y = camera.position.y
    let x = camera.position.x
    let z = camera.position.z
    // let zoom = this.camera?.zoom

    switch (MODE) {
      case 'DOLLY':
        var scale = dominantDirection === 'x' ? directionX : directionY

        var dir = new Vector3()
        dir
          .subVectors(this.viewer!.controls.target, camera.position)
          .normalize()

        console.log('going to target at ', this.viewer!.controls.target)
        console.log('dolly zooming by ', scale, 'on the vector ', dir)

        console.log(dir)
        // Zoom in or out
        var dollyZoom = dir.multiplyScalar(scale * 1.4)
        camera.position.add(dollyZoom)

        coords.x = camera.position.x
        coords.y = camera.position.y
        coords.z = camera.position.z
        break
      case 'ZOOM':
        console.log('zooming')
        var scale = dominantDirection === 'x' ? directionX : directionY

        coords.zoom = coords.zoom + 0.2 * scale

        break
      case 'PAN':
        var direction = new Vector3()
        direction
          .subVectors(this.viewer!.controls.target, camera.position)
          .normalize()

        // Calculate the right vector
        const right = new Vector3()
        right.crossVectors(camera.up, direction).normalize()

        // Calculate horizontal pan (move along the right vector)
        const horizontalPan = right.clone().multiplyScalar(directionX)
        camera.position.add(horizontalPan)

        // Calculate vertical pan (move along the camera's up vector)
        const verticalPan = new Vector3()
          .copy(camera.up)
          .multiplyScalar(directionY)
        camera.position.add(verticalPan)

        coords.x = camera.position.x
        coords.y = camera.position.y
        coords.z = camera.position.z
        break
    }

    return coords
  }

  handleEvent(event: Event) {
    // console.log(event)
    if (this.latestEvents.length > 1 && !this.tween) {
      const [first, second] = this.latestEvents

      const camera: PerspectiveCamera = this.camera!
      const coords = this.calculateNewCameraPosition([first, second])
      // console.log(coords)
      // camera.position.set(coords.x + 100, coords.y, coords.z)
      const duration = 1200

      const from = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
        zoom: camera.zoom,
      }
      const to = coords
      console.table(from)
      console.table(to)

      console.log(from.zoom, coords.zoom)

      const isZooming = !!(from.zoom != coords!.zoom)
      // console.log('isZooming', isZooming)

      // console.log(from, coords)
      this.tween = new TWEEN.Tween(from)
        .to(to, duration)
        .easing(TWEEN.Easing.Quadratic.InOut) // Add this line for a bezier curve effect
        .onUpdate(() => {
          if (isZooming) {
            camera.zoom = from.zoom
            camera.updateProjectionMatrix()
          } else {
            camera.position.set(from.x, from.y, from.z)
          }
        })

      this.tween.start().onComplete(() => {
        console.log('Tween complete')

        this.tween = null
        this.latestEvents = []
      })
    }
    this.latestEvents.push(event)
  }

  handleEventUp(event: Event) {
    console.log('Ending recording', !!this.tween)
    if (this.tween) {
      this.tween.stop()
      this.tween = null
    }
    this.latestEvents = []
  }
  handleEventDown(event: Event) {
    console.log('Starting recording')
    this.latestEvents = []
    if (this.tween) {
      this.tween.stop()
      this.tween = null
    }
    this.latestEvents = []
  }
}

const service = new GestureService()
export default service
