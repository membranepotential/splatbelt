import {
  type PerspectiveCamera,
  Vector3,
  Spherical,
  Quaternion,
  EventDispatcher,
} from 'three'
import type { CameraSetting } from '$lib/types'

const TWO_PI = 2 * Math.PI
const Y_AXIS = new Vector3(0, 1, 0)

type MinMax = {
  min: number
  max: number
}

type ControlLimits = {
  distance: MinMax
  zoom: MinMax
  polarAngle: MinMax
  azimuthAngle: MinMax
}

interface ControlEvents {
  type: 'change' | 'updated'
}

export class Control extends EventDispatcher<ControlEvents> {
  limits: ControlLimits = {
    distance: { min: 0.01, max: Infinity },
    zoom: { min: 0.01, max: Infinity },
    polarAngle: { min: 0.01, max: Math.PI / 2 },
    azimuthAngle: { min: -Infinity, max: Infinity },
  }

  private camera: PerspectiveCamera
  private _target: Vector3

  private upQuat = new Quaternion()
  private upQuatInv = new Quaternion()

  private delta = {
    spherical: new Spherical(0, 0, 0),
    offset: new Vector3(),
    zoom: 1.0,
  }
  private nextCam: CameraSetting | null = null

  constructor(
    camera: PerspectiveCamera,
    target: Vector3,
    limits: { [P in keyof ControlLimits]?: Partial<MinMax> } = {}
  ) {
    super()
    this.camera = camera
    this._target = target.clone()

    Object.entries(limits).forEach(([k, v]) => {
      Object.assign(this.limits[k as keyof ControlLimits], v)
    })

    this.camera.lookAt(this._target)
    this.computeUpRotation()
  }

  set position(newPos: Vector3) {
    this.camera.position.copy(newPos)
  }

  set up(newUp: Vector3) {
    this.camera.up.copy(newUp)
    this.computeUpRotation()
  }

  get up() {
    return this.camera.up.clone()
  }

  set target(newTarget: Vector3) {
    this._target.copy(newTarget)
    this.camera.lookAt(this._target)
  }

  get target() {
    return this._target.clone()
  }

  sample(): CameraSetting {
    return {
      position: this.camera.position.clone(),
      target: this.target,
      zoom: this.camera.zoom,
    }
  }

  update() {
    if (this.nextCam) {
      // Move the camera for an animation
      this.camera.position.copy(this.nextCam.position)
      this.target = this.nextCam.target

      if (this.camera.zoom !== this.nextCam.zoom) {
        this.camera.zoom = this.nextCam.zoom
        this.camera.updateProjectionMatrix()
      }

      this.nextCam = null
    } else {
      // Transform the camera for a user interaction
      const offset = this.camera.position.clone().sub(this._target)

      // rotate offset to "y-axis-is-up" space
      offset.applyQuaternion(this.upQuat)

      // angle from z-axis around y-axis
      const spherical = new Spherical().setFromVector3(offset)

      spherical.theta += this.delta.spherical.theta
      spherical.phi += this.delta.spherical.phi
      spherical.radius += this.delta.spherical.radius

      this.clampSpherical(spherical)
      offset.setFromSpherical(spherical)

      // rotate offset back to "camera-up-vector-is-up" space
      offset.applyQuaternion(this.upQuatInv)

      // move target to panned location
      this._target.add(this.delta.offset)

      this.camera.position.copy(this._target).add(offset)
      this.camera.lookAt(this._target)

      if (this.delta.zoom !== 1) {
        this.camera.zoom = this.clampZoom(this.camera.zoom * this.delta.zoom)
        this.camera.updateProjectionMatrix()
      }

      this.resetDelta()
    }

    this.dispatchEvent({ type: 'updated' })
  }

  moveTo(camera: CameraSetting) {
    this.nextCam = camera
    this.scheduleUpdate()
  }

  rotate(left: number, up: number) {
    this.delta.spherical.theta -= TWO_PI * left
    this.delta.spherical.phi -= TWO_PI * up
    this.scheduleUpdate()
  }

  panLeft(distance: number) {
    const v = new Vector3()
    v.setFromMatrixColumn(this.camera.matrix, 0) // get X column of objectMatrix
    v.multiplyScalar(-distance)
    this.delta.offset.add(v)
  }

  panUp(distance: number) {
    const v = new Vector3()
    v.setFromMatrixColumn(this.camera.matrix, 1)
    v.multiplyScalar(distance)
    this.delta.offset.add(v)
  }

  pan(left: number, up: number) {
    const dist = this.camera.position.distanceTo(this._target)

    // half of the fov is center to top of screen
    const targetDistance =
      2 * dist * Math.tan(((this.camera.fov / 2) * Math.PI) / 180.0)
    this.panLeft(left * targetDistance)
    this.panUp(up * targetDistance)

    this.scheduleUpdate()
  }

  dolly(scale: number) {
    const dist = this.camera.position.distanceTo(this._target)
    this.delta.spherical.radius += 2 * scale * dist
    this.scheduleUpdate()
  }

  zoom(scale: number) {
    this.delta.zoom *= Math.pow(5, -scale)
    this.scheduleUpdate()
  }

  private computeUpRotation() {
    this.upQuat.setFromUnitVectors(this.camera.up, Y_AXIS)
    this.upQuatInv.copy(this.upQuat).invert()
  }

  private clampSpherical(spherical: Spherical) {
    let min = this.limits.azimuthAngle.min
    let max = this.limits.azimuthAngle.max

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += TWO_PI
      else if (min > Math.PI) min -= TWO_PI

      if (max < -Math.PI) max += TWO_PI
      else if (max > Math.PI) max -= TWO_PI

      if (min <= max) {
        spherical.theta = Math.max(min, Math.min(max, spherical.theta))
      } else {
        spherical.theta =
          spherical.theta > (min + max) / 2
            ? Math.max(min, spherical.theta)
            : Math.min(max, spherical.theta)
      }
    }

    spherical.phi = Math.max(
      this.limits.polarAngle.min,
      Math.min(this.limits.polarAngle.max, spherical.phi)
    )

    spherical.radius = Math.max(
      this.limits.distance.min,
      Math.min(this.limits.distance.max, spherical.radius)
    )

    spherical.makeSafe()
  }

  private clampZoom(zoom: number) {
    return Math.max(this.limits.zoom.min, Math.min(this.limits.zoom.max, zoom))
  }

  private resetDelta() {
    this.delta.spherical.set(0, 0, 0)
    this.delta.offset.set(0, 0, 0)
    this.delta.zoom = 1
  }

  private scheduleUpdate() {
    this.dispatchEvent({ type: 'change' })
  }
}
