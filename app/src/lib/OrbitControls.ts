import {
  EventDispatcher,
  MOUSE,
  TOUCH,
  Vector3,
  PerspectiveCamera,
  Ray,
  Plane,
  Spherical,
  MathUtils,
  OrthographicCamera,
  Quaternion,
  Vector2,
  Matrix4,
} from 'three'

type Axis = 'x' | 'y'

const changeEvent = { type: 'change' }
const startEvent = { type: 'start' }
const endEvent = { type: 'end' }

const _ray = new Ray()
const _plane = new Plane()

const STATE = {
  NONE: -1,
  ROTATE: 0,
  DOLLY: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_PAN: 4,
  TOUCH_DOLLY_PAN: 5,
  TOUCH_DOLLY_ROTATE: 6,
}

const TILT_LIMIT = Math.cos(70 * MathUtils.DEG2RAD)
const EPS = 0.000001
const TWO_PI = 2 * Math.PI

// OrbitControls performs orbiting, dollying (zooming), and panning.
// Unlike TrackballControls, it maintains the "up" direction object.up (+Y by default).
//
//    Orbit - left mouse / touch: one-finger move
//    Zoom - middle mouse, or mousewheel / touch: two-finger spread or squish
//    Pan - right mouse, or left mouse + ctrl/meta/shiftKey, or arrow keys / touch: two-finger move
export default class OrbitControls extends EventDispatcher {
  // The camera to be controlled
  object: PerspectiveCamera | OrthographicCamera

  // HTML element to listen for events on
  domElement: HTMLElement

  // Set to false to disable this control
  enabled: boolean

  // "target" sets the location of focus, where the camera orbits around
  target: Vector3

  // How far you can dolly in and out ( PerspectiveCamera only )
  minDistance: number
  maxDistance: number

  // How far you can zoom in and out ( OrthographicCamera only )
  minZoom: number
  maxZoom: number

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  minPolarAngle: number
  maxPolarAngle: number

  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  minAzimuthAngle: number
  maxAzimuthAngle: number

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  enableDamping: boolean
  dampingFactor: number

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  enableZoom: boolean
  zoomSpeed: number
  zoomToCursor: boolean

  // Set to false to disable rotating
  enableRotate: boolean
  rotateSpeed: number

  // Set to false to disable panning
  enablePan: boolean
  panSpeed: number
  screenSpacePanning: boolean // if true, pan in screen-space
  keyPanSpeed: number // pixels moved per arrow key push

  // Set to true to automatically rotate around the target
  // If auto-rotate is enabled, you must call controls.update() in your animation loop
  autoRotate: boolean
  autoRotateSpeed: number // 30 seconds per round when fps is 60

  // The four arrow keys
  keys: { LEFT: string; UP: string; RIGHT: string; BOTTOM: string }

  // Mouse buttons
  mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE }

  // Touch fingers
  touches: { ONE: TOUCH; TWO: TOUCH }

  // saved state for reset
  target0: Vector3
  position0: Vector3
  zoom0: number

  private domElementKeyEvents: HTMLElement | null = null

  private spherical: Spherical = new Spherical()
  private sphericalDelta: Spherical = new Spherical()

  private scale: number = 1

  private rotateStart = new Vector2()
  private rotateEnd = new Vector2()
  private rotateDelta = new Vector2()

  private panOffset = new Vector3()
  private panStart = new Vector2()
  private panEnd = new Vector2()
  private panDelta = new Vector2()

  private dollyStart = new Vector2()
  private dollyEnd = new Vector2()
  private dollyDelta = new Vector2()
  private dollyDirection = new Vector3()

  private mouse = new Vector2()
  private performCursorZoom: boolean = false

  private pointers: PointerEvent[] = []
  private pointerPositions: Record<number, Vector2> = {}

  private state: number = STATE.NONE

  private quat = new Quaternion()
  private quatInverse = new Quaternion()
  private lastPosition = new Vector3()
  private lastQuaternion = new Quaternion()
  private lastTargetPosition = new Vector3()

  constructor(
    object: PerspectiveCamera | OrthographicCamera,
    domElement: HTMLElement,
    options: Partial<OrbitControls>
  ) {
    super()

    this.object = object
    this.domElement = domElement
    this.domElement.style.touchAction = 'none' // disable touch scroll

    // Set to false to disable this control
    this.enabled = options.enabled ?? true

    // "target" sets the location of focus, where the object orbits around
    this.target = new Vector3()

    // How far you can dolly in and out ( PerspectiveCamera only )
    this.minDistance = options.minDistance ?? 0
    this.maxDistance = options.maxDistance ?? Infinity

    // How far you can zoom in and out ( OrthographicCamera only )
    this.minZoom = options.minZoom ?? 0
    this.maxZoom = options.maxZoom ?? Infinity

    // How far you can orbit vertically, upper and lower limits.
    // Range is 0 to Math.PI radians.
    this.minPolarAngle = options.minPolarAngle ?? 0 // radians
    this.maxPolarAngle = options.maxPolarAngle ?? Math.PI // radians

    // How far you can orbit horizontally, upper and lower limits.
    // If set, the interval [min, max] must be a sub-interval of [- 2 PI, 2 PI], with ( max - min < 2 PI )
    this.minAzimuthAngle = options.minAzimuthAngle ?? -Infinity // radians
    this.maxAzimuthAngle = options.maxAzimuthAngle ?? Infinity // radians

    // Set to true to enable damping (inertia)
    // If damping is enabled, you must call controls.update() in your animation loop
    this.enableDamping = options.enableDamping ?? false
    this.dampingFactor = options.dampingFactor ?? 0.05

    // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
    // Set to false to disable zooming
    this.enableZoom = options.enableZoom ?? true
    this.zoomSpeed = options.zoomSpeed ?? 1.0

    // Set to false to disable rotating
    this.enableRotate = options.enableRotate ?? true
    this.rotateSpeed = options.rotateSpeed ?? 1.0

    // Set to false to disable panning
    this.enablePan = options.enablePan ?? true
    this.panSpeed = options.panSpeed ?? 1.0
    this.screenSpacePanning = options.screenSpacePanning ?? true // if false, pan orthogonal to world-space direction camera.up
    this.keyPanSpeed = options.keyPanSpeed ?? 7.0 // pixels moved per arrow key push
    this.zoomToCursor = options.zoomToCursor ?? false

    // Set to true to automatically rotate around the target
    // If auto-rotate is enabled, you must call controls.update() in your animation loop
    this.autoRotate = options.autoRotate ?? false
    this.autoRotateSpeed = options.autoRotateSpeed ?? 2.0 // 30 seconds per orbit when fps is 60

    // The four arrow keys
    this.keys = options.keys ?? {
      LEFT: 'KeyA',
      UP: 'KeyW',
      RIGHT: 'KeyD',
      BOTTOM: 'KeyS',
    }

    // Mouse buttons
    this.mouseButtons = options.mouseButtons ?? {
      LEFT: MOUSE.ROTATE,
      MIDDLE: MOUSE.DOLLY,
      RIGHT: MOUSE.PAN,
    }

    // Touch fingers
    this.touches = options.touches ?? {
      ONE: TOUCH.ROTATE,
      TWO: TOUCH.DOLLY_PAN,
    }

    // for reset
    this.target0 = this.target.clone()
    this.position0 = this.object.position.clone()
    this.zoom0 = this.object.zoom

    this.quat = this.quat.setFromUnitVectors(
      this.object.up,
      new Vector3(0, 1, 0)
    )
    this.quatInverse = this.quat.clone().invert()

    this.domElement.addEventListener(
      'contextmenu',
      this.onContextMenu.bind(this)
    )
    this.domElement.addEventListener(
      'pointerdown',
      this.onPointerDown.bind(this)
    )
    this.domElement.addEventListener(
      'pointercancel',
      this.onPointerUp.bind(this)
    )
    this.domElement.addEventListener('wheel', this.onMouseWheel.bind(this), {
      passive: false,
    })

    this.update()
  }

  getPolarAngle(): number {
    return this.spherical.phi
  }

  getAzimuthalAngle(): number {
    return this.spherical.theta
  }

  getDistance(): number {
    return this.object.position.distanceTo(this.target)
  }

  listenToKeyEvents(domElement: HTMLElement): void {
    domElement.addEventListener('keydown', this.onKeyDown.bind(this))
    this.domElementKeyEvents = domElement
  }

  stopListenToKeyEvents(): void {
    if (this.domElementKeyEvents) {
      this.domElementKeyEvents.removeEventListener('keydown', this.onKeyDown)
      this.domElementKeyEvents = null
    }
  }

  saveState(): void {
    this.target0.copy(this.target)
    this.position0.copy(this.object.position)
    this.zoom0 = this.object.zoom
  }

  reset(): void {
    this.target.copy(this.target0)
    this.object.position.copy(this.position0)
    this.object.zoom = this.zoom0

    this.object.updateProjectionMatrix()
    this.dispatchEvent(changeEvent)

    this.update()
    this.state = STATE.NONE
  }

  update(): boolean {
    this.quat.setFromUnitVectors(this.object.up, new Vector3(0, 1, 0))
    this.quatInverse.copy(this.quat).invert()

    const position = this.object.position
    const offset = position.clone().sub(this.target)

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion(this.quat)

    // angle from z-axis around y-axis
    this.spherical.setFromVector3(offset)

    if (this.autoRotate && this.state === STATE.NONE) {
      this.rotateLeft(this.getAutoRotationAngle())
    }

    if (this.enableDamping) {
      this.spherical.theta += this.sphericalDelta.theta * this.dampingFactor
      this.spherical.phi += this.sphericalDelta.phi * this.dampingFactor
    } else {
      this.spherical.theta += this.sphericalDelta.theta
      this.spherical.phi += this.sphericalDelta.phi
    }

    // restrict theta to be between desired limits
    let min = this.minAzimuthAngle
    let max = this.maxAzimuthAngle

    if (isFinite(min) && isFinite(max)) {
      if (min < -Math.PI) min += TWO_PI
      else if (min > Math.PI) min -= TWO_PI

      if (max < -Math.PI) max += TWO_PI
      else if (max > Math.PI) max -= TWO_PI

      if (min <= max) {
        this.spherical.theta = Math.max(
          min,
          Math.min(max, this.spherical.theta)
        )
      } else {
        this.spherical.theta =
          this.spherical.theta > (min + max) / 2
            ? Math.max(min, this.spherical.theta)
            : Math.min(max, this.spherical.theta)
      }
    }

    // restrict phi to be between desired limits
    this.spherical.phi = Math.max(
      this.minPolarAngle,
      Math.min(this.maxPolarAngle, this.spherical.phi)
    )

    this.spherical.makeSafe()

    // move target to panned location
    if (this.enableDamping === true) {
      this.target.addScaledVector(this.panOffset, this.dampingFactor)
    } else {
      this.target.add(this.panOffset)
    }

    // adjust the camera position based on zoom only if we're not zooming to the cursor or if it's an ortho camera
    // we adjust zoom later in these cases
    if (
      (this.zoomToCursor && this.performCursorZoom) ||
      this.object.type === 'OrthographicCamera'
    ) {
      this.spherical.radius = this.clampDistance(this.spherical.radius)
    } else {
      this.spherical.radius = this.clampDistance(
        this.spherical.radius * this.scale
      )
    }

    offset.setFromSpherical(this.spherical)

    // rotate offset back to "camera-up-vector-is-up" space
    offset.applyQuaternion(this.quatInverse)

    position.copy(this.target).add(offset)
    this.object.lookAt(this.target)

    if (this.enableDamping === true) {
      this.sphericalDelta.theta *= 1 - this.dampingFactor
      this.sphericalDelta.phi *= 1 - this.dampingFactor
      this.panOffset.multiplyScalar(1 - this.dampingFactor)
    } else {
      this.sphericalDelta.set(0, 0, 0)
      this.panOffset.set(0, 0, 0)
    }

    // adjust camera position
    let zoomChanged = false
    if (this.zoomToCursor && this.performCursorZoom) {
      let newRadius = null
      if (this.object.type === 'PerspectiveCamera') {
        // move the camera down the pointer ray
        // this method avoids floating point error
        const prevRadius = offset.length()
        newRadius = this.clampDistance(prevRadius * this.scale)

        const radiusDelta = prevRadius - newRadius
        this.object.position.addScaledVector(this.dollyDirection, radiusDelta)
        this.object.updateMatrixWorld()
      } else if (this.object.type === 'OrthographicCamera') {
        // adjust the ortho camera position based on zoom changes
        const mouseBefore = new Vector3(this.mouse.x, this.mouse.y, 0)
        mouseBefore.unproject(this.object)

        this.object.zoom = Math.max(
          this.minZoom,
          Math.min(this.maxZoom, this.object.zoom / this.scale)
        )
        this.object.updateProjectionMatrix()
        zoomChanged = true

        const mouseAfter = new Vector3(this.mouse.x, this.mouse.y, 0)
        mouseAfter.unproject(this.object)

        this.object.position.sub(mouseAfter).add(mouseBefore)
        this.object.updateMatrixWorld()

        newRadius = offset.length()
      } else {
        console.warn(
          'WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled.'
        )
        this.zoomToCursor = false
      }

      // handle the placement of the target
      if (newRadius !== null) {
        if (this.screenSpacePanning) {
          // position the orbit target in front of the new camera position
          this.target
            .set(0, 0, -1)
            .transformDirection(this.object.matrix)
            .multiplyScalar(newRadius)
            .add(this.object.position)
        } else {
          // get the ray and translation plane to compute target
          _ray.origin.copy(this.object.position)
          _ray.direction.set(0, 0, -1).transformDirection(this.object.matrix)

          // if the camera is 20 degrees above the horizon then don't adjust the focus target to avoid
          // extremely large values
          if (Math.abs(this.object.up.dot(_ray.direction)) < TILT_LIMIT) {
            this.object.lookAt(this.target)
          } else {
            _plane.setFromNormalAndCoplanarPoint(this.object.up, this.target)
            _ray.intersectPlane(_plane, this.target)
          }
        }
      }
    } else if (this.object.type === 'OrthographicCamera') {
      this.object.zoom = Math.max(
        this.minZoom,
        Math.min(this.maxZoom, this.object.zoom / this.scale)
      )
      this.object.updateProjectionMatrix()
      zoomChanged = true
    }

    this.scale = 1
    this.performCursorZoom = false

    // update condition is:
    // min(camera displacement, camera rotation in radians)^2 > EPS
    // using small-angle approximation cos(x/2) = 1 - x^2 / 8
    if (
      zoomChanged ||
      this.lastPosition.distanceToSquared(this.object.position) > EPS ||
      8 * (1 - this.lastQuaternion.dot(this.object.quaternion)) > EPS ||
      this.lastTargetPosition.distanceToSquared(this.target) > 0
    ) {
      this.dispatchEvent(changeEvent)

      this.lastPosition.copy(this.object.position)
      this.lastQuaternion.copy(this.object.quaternion)
      this.lastTargetPosition.copy(this.target)

      zoomChanged = false
      return true
    }
    return false
  }

  dispose() {
    this.domElement.removeEventListener('contextmenu', this.onContextMenu)
    this.domElement.removeEventListener('pointerdown', this.onPointerDown)
    this.domElement.removeEventListener('pointercancel', this.onPointerUp)
    this.domElement.removeEventListener('wheel', this.onMouseWheel)
    this.domElement.removeEventListener('pointermove', this.onPointerMove)
    this.domElement.removeEventListener('pointerup', this.onPointerUp)

    if (this.domElementKeyEvents !== null) {
      this.domElementKeyEvents.removeEventListener('keydown', this.onKeyDown)
      this.domElementKeyEvents = null
    }
  }

  getAutoRotationAngle() {
    return ((2 * Math.PI) / 60 / 60) * this.autoRotateSpeed
  }

  getZoomScale() {
    return Math.pow(0.95, this.zoomSpeed)
  }

  rotateLeft(angle: number) {
    this.sphericalDelta.theta -= angle
  }

  rotateUp(angle: number) {
    this.sphericalDelta.phi -= angle
  }

  panLeft(distance: number, objectMatrix: Matrix4) {
    const v = new Vector3()
    v.setFromMatrixColumn(objectMatrix, 0) // get X column of objectMatrix
    v.multiplyScalar(-distance)
    this.panOffset.add(v)
  }

  panUp(distance: number, objectMatrix: Matrix4) {
    const v = new Vector3()
    if (this.screenSpacePanning === true) {
      v.setFromMatrixColumn(objectMatrix, 1)
    } else {
      v.setFromMatrixColumn(objectMatrix, 0)
      v.crossVectors(this.object.up, v)
    }
    v.multiplyScalar(distance)
    this.panOffset.add(v)
  }

  pan(deltaX: number, deltaY: number) {
    const element = this.domElement

    if (this.object.type === 'PerspectiveCamera') {
      this.object = this.object as PerspectiveCamera

      // perspective
      const position = this.object.position
      const offset = new Vector3()
      offset.copy(position).sub(this.target)
      let targetDistance = offset.length()

      // half of the fov is center to top of screen
      targetDistance *= Math.tan(((this.object.fov / 2) * Math.PI) / 180.0)

      // we use only clientHeight here so aspect ratio does not distort speed
      this.panLeft(
        (2 * deltaX * targetDistance) / element.clientHeight,
        this.object.matrix
      )
      this.panUp(
        (2 * deltaY * targetDistance) / element.clientHeight,
        this.object.matrix
      )
    } else if (this.object.type === 'OrthographicCamera') {
      this.object = this.object as OrthographicCamera

      // orthographic
      this.panLeft(
        (deltaX * (this.object.right - this.object.left)) /
          this.object.zoom /
          element.clientWidth,
        this.object.matrix
      )
      this.panUp(
        (deltaY * (this.object.top - this.object.bottom)) /
          this.object.zoom /
          element.clientHeight,
        this.object.matrix
      )
    } else {
      // camera neither orthographic nor perspective
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.'
      )
      this.enablePan = false
    }
  }

  dollyOut(dollyScale: number) {
    if (
      this.object.type === 'PerspectiveCamera' ||
      this.object.type === 'OrthographicCamera'
    ) {
      this.scale /= dollyScale
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
      )
      this.enableZoom = false
    }
  }

  dollyIn(dollyScale: number) {
    if (
      this.object.type === 'PerspectiveCamera' ||
      this.object.type === 'OrthographicCamera'
    ) {
      this.scale *= dollyScale
    } else {
      console.warn(
        'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.'
      )
      this.enableZoom = false
    }
  }

  updateMouseParameters(event: MouseEvent) {
    if (!this.zoomToCursor) {
      return
    }

    this.performCursorZoom = true

    const rect = this.domElement.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const w = rect.width
    const h = rect.height

    this.mouse.x = (x / w) * 2 - 1
    this.mouse.y = -(y / h) * 2 + 1

    this.dollyDirection
      .set(this.mouse.x, this.mouse.y, 1)
      .unproject(this.object)
      .sub(this.object.position)
      .normalize()
  }

  clampDistance(dist: number) {
    return Math.max(this.minDistance, Math.min(this.maxDistance, dist))
  }

  // handleMouseDown(event: MouseEvent) {
  //   this.updateMouseParameters(event)
  //   this.mouseStart.set(event.clientX, event.clientY)
  // }

  handleMouseDownRotate(event: MouseEvent) {
    this.rotateStart.set(event.clientX, event.clientY)
  }

  handleMouseDownDolly(event: MouseEvent) {
    this.updateMouseParameters(event)
    this.dollyStart.set(event.clientX, event.clientY)
  }

  handleMouseDownPan(event: MouseEvent) {
    this.panStart.set(event.clientX, event.clientY)
  }

  handleMouseMoveRotate(event: MouseEvent) {
    this.rotateEnd.set(event.clientX, event.clientY)
    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed)

    const element = this.domElement
    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight) // yes, height
    this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight)
    this.rotateStart.copy(this.rotateEnd)
    this.update()
  }

  handleMouseMoveDolly(event: MouseEvent) {
    this.dollyEnd.set(event.clientX, event.clientY)
    this.dollyDelta.subVectors(this.dollyEnd, this.dollyStart)

    if (this.dollyDelta.y > 0) {
      this.dollyOut(this.getZoomScale())
    } else if (this.dollyDelta.y < 0) {
      this.dollyIn(this.getZoomScale())
    }

    this.dollyStart.copy(this.dollyEnd)
    this.update()
  }

  handleMouseMovePan(event: MouseEvent) {
    this.panEnd.set(event.clientX, event.clientY)
    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed)

    this.pan(this.panDelta.x, this.panDelta.y)

    this.panStart.copy(this.panEnd)
    this.update()
  }

  handleMouseWheel(event: WheelEvent) {
    this.updateMouseParameters(event)

    if (event.deltaY < 0) {
      this.dollyIn(this.getZoomScale())
    } else if (event.deltaY > 0) {
      this.dollyOut(this.getZoomScale())
    }

    this.update()
  }

  handleKeyDown(event: KeyboardEvent) {
    let needsUpdate = false

    switch (event.code) {
      case this.keys.UP:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          this.rotateUp(
            (2 * Math.PI * this.rotateSpeed) / this.domElement.clientHeight
          )
        } else {
          this.pan(0, this.keyPanSpeed)
        }

        needsUpdate = true
        break

      case this.keys.BOTTOM:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          this.rotateUp(
            (-2 * Math.PI * this.rotateSpeed) / this.domElement.clientHeight
          )
        } else {
          this.pan(0, -this.keyPanSpeed)
        }

        needsUpdate = true
        break

      case this.keys.LEFT:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          this.rotateLeft(
            (2 * Math.PI * this.rotateSpeed) / this.domElement.clientHeight
          )
        } else {
          this.pan(this.keyPanSpeed, 0)
        }

        needsUpdate = true
        break

      case this.keys.RIGHT:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          this.rotateLeft(
            (-2 * Math.PI * this.rotateSpeed) / this.domElement.clientHeight
          )
        } else {
          this.pan(-this.keyPanSpeed, 0)
        }

        needsUpdate = true
        break
    }

    if (needsUpdate) {
      // prevent the browser from scrolling on cursor keys
      event.preventDefault()
      this.update()
    }
  }

  handleTouchStartRotate() {
    if (this.pointers.length === 1) {
      this.rotateStart.set(this.pointers[0].pageX, this.pointers[0].pageY)
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX)
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY)
      this.rotateStart.set(x, y)
    }
  }

  handleTouchStartPan(axis) {
    if (this.pointers.length === 1) {
      this.panStart.set(this.pointers[0].pageX, this.pointers[0].pageY)
    } else {
      const x = 0.5 * (this.pointers[0].pageX + this.pointers[1].pageX)
      const y = 0.5 * (this.pointers[0].pageY + this.pointers[1].pageY)
      this.panStart.set(x, y)
    }
  }

  handleTouchStartDolly() {
    const dx = this.pointers[0].pageX - this.pointers[1].pageX
    const dy = this.pointers[0].pageY - this.pointers[1].pageY
    const distance = Math.sqrt(dx * dx + dy * dy)
    this.dollyStart.set(0, distance)
  }

  handleTouchStartDollyPan() {
    if (this.enableZoom) this.handleTouchStartDolly()
    if (this.enablePan) this.handleTouchStartPan()
  }

  handleTouchStartDollyRotate() {
    if (this.enableZoom) this.handleTouchStartDolly()
    if (this.enableRotate) this.handleTouchStartRotate()
  }

  handleTouchMoveRotate(event: PointerEvent) {
    if (this.pointers.length == 1) {
      this.rotateEnd.set(event.pageX, event.pageY)
    } else {
      const position = this.getSecondPointerPosition(event)
      const x = 0.5 * (event.pageX + position.x)
      const y = 0.5 * (event.pageY + position.y)
      this.rotateEnd.set(x, y)
    }

    this.rotateDelta
      .subVectors(this.rotateEnd, this.rotateStart)
      .multiplyScalar(this.rotateSpeed)

    const element = this.domElement
    this.rotateLeft((2 * Math.PI * this.rotateDelta.x) / element.clientHeight) // yes, height
    this.rotateUp((2 * Math.PI * this.rotateDelta.y) / element.clientHeight)
    this.rotateStart.copy(this.rotateEnd)
  }

  handleTouchMovePan(event: PointerEvent) {
    if (this.pointers.length === 1) {
      this.panEnd.set(event.pageX, event.pageY)
    } else {
      const position = this.getSecondPointerPosition(event)
      const x = 0.5 * (event.pageX + position.x)
      const y = 0.5 * (event.pageY + position.y)
      this.panEnd.set(x, y)
    }

    this.panDelta
      .subVectors(this.panEnd, this.panStart)
      .multiplyScalar(this.panSpeed)
    this.pan(this.panDelta.x, this.panDelta.y)
    this.panStart.copy(this.panEnd)
  }

  handleTouchMoveDolly(event: PointerEvent) {
    const position = this.getSecondPointerPosition(event)
    const dx = event.pageX - position.x
    const dy = event.pageY - position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    this.dollyEnd.set(0, distance)
    this.dollyDelta.set(
      0,
      Math.pow(this.dollyEnd.y / this.dollyStart.y, this.zoomSpeed)
    )
    this.dollyOut(this.dollyDelta.y)
    this.dollyStart.copy(this.dollyEnd)
  }

  handleTouchMoveDollyPan(event: PointerEvent) {
    if (this.enableZoom) this.handleTouchMoveDolly(event)
    if (this.enablePan) this.handleTouchMovePan(event)
  }

  handleTouchMoveDollyRotate(event: PointerEvent) {
    if (this.enableZoom) this.handleTouchMoveDolly(event)
    if (this.enableRotate) this.handleTouchMoveRotate(event)
  }

  onPointerDown(event: PointerEvent) {
    if (this.enabled === false) return

    if (this.pointers.length === 0) {
      this.domElement.setPointerCapture(event.pointerId)
      this.domElement.addEventListener(
        'pointermove',
        this.onPointerMove.bind(this)
      )
      this.domElement.addEventListener('pointerup', this.onPointerUp.bind(this))
    }

    this.addPointer(event)

    if (event.pointerType === 'touch') {
      this.onTouchStart(event)
    } else {
      this.onMouseDown(event)
    }
  }

  onPointerMove(event: PointerEvent) {
    if (this.enabled === false) return

    if (event.pointerType === 'touch') {
      this.onTouchMove(event)
    } else {
      this.onMouseMove(event)
    }
  }

  onPointerUp(event: PointerEvent) {
    this.removePointer(event)

    if (this.pointers.length === 0) {
      this.domElement.releasePointerCapture(event.pointerId)
      this.domElement.removeEventListener('pointermove', this.onPointerMove)
      this.domElement.removeEventListener('pointerup', this.onPointerUp)
    }

    this.dispatchEvent(endEvent)
    this.state = STATE.NONE
  }

  onMouseDown(event: MouseEvent) {
    let mouseAction

    switch (event.button) {
      case 0:
        mouseAction = this.mouseButtons.LEFT
        break

      case 1:
        mouseAction = this.mouseButtons.MIDDLE
        break

      case 2:
        mouseAction = this.mouseButtons.RIGHT
        break

      default:
        mouseAction = -1
    }

    switch (mouseAction) {
      case MOUSE.DOLLY:
        if (this.enableZoom === false) return

        this.handleMouseDownDolly(event)
        this.state = STATE.DOLLY
        break

      case MOUSE.ROTATE:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (this.enablePan === false) return

          this.handleMouseDownPan(event)
          this.state = STATE.PAN
        } else {
          if (this.enableRotate === false) return

          this.handleMouseDownRotate(event)
          this.state = STATE.ROTATE
        }

        break

      case MOUSE.PAN:
        if (event.ctrlKey || event.metaKey || event.shiftKey) {
          if (this.enableRotate === false) return

          this.handleMouseDownRotate(event)
          this.state = STATE.ROTATE
        } else {
          if (this.enablePan === false) return

          this.handleMouseDownPan(event)
          this.state = STATE.PAN
        }
        break

      default:
        this.state = STATE.NONE
    }

    if (this.state !== STATE.NONE) {
      this.dispatchEvent(startEvent)
    }
  }

  onMouseMove(event: PointerEvent) {
    switch (this.state) {
      case STATE.ROTATE:
        if (this.enableRotate === false) return
        this.handleMouseMoveRotate(event)
        break

      case STATE.DOLLY:
        if (this.enableZoom === false) return
        this.handleMouseMoveDolly(event)
        break

      case STATE.PAN:
        if (this.enablePan === false) return
        this.handleMouseMovePan(event)
        break
    }
  }

  onMouseWheel(event: WheelEvent) {
    if (
      this.enabled === false ||
      this.enableZoom === false ||
      this.state !== STATE.NONE
    )
      return

    event.preventDefault()

    this.dispatchEvent(startEvent)
    this.handleMouseWheel(event)
    this.dispatchEvent(endEvent)
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.enabled === false || this.enablePan === false) return
    this.handleKeyDown(event)
  }

  onTouchStart(event: PointerEvent) {
    this.trackPointer(event)

    switch (this.pointers.length) {
      case 1:
        switch (this.touches.ONE) {
          case TOUCH.ROTATE:
            if (this.enableRotate === false) return
            this.handleTouchStartRotate()
            this.state = STATE.TOUCH_ROTATE
            break

          case TOUCH.PAN:
            if (this.enablePan === false) return
            this.handleTouchStartPan()
            this.state = STATE.TOUCH_PAN
            break

          default:
            this.state = STATE.NONE
        }

        break

      case 2:
        switch (this.touches.TWO) {
          case TOUCH.DOLLY_PAN:
            if (this.enableZoom === false && this.enablePan === false) return

            this.handleTouchStartDollyPan()
            this.state = STATE.TOUCH_DOLLY_PAN
            break

          case TOUCH.DOLLY_ROTATE:
            if (this.enableZoom === false && this.enableRotate === false) return

            this.handleTouchStartDollyRotate()
            this.state = STATE.TOUCH_DOLLY_ROTATE
            break

          default:
            this.state = STATE.NONE
        }

        break

      default:
        this.state = STATE.NONE
    }

    if (this.state !== STATE.NONE) {
      this.dispatchEvent(startEvent)
    }
  }

  onTouchMove(event: PointerEvent) {
    this.trackPointer(event)

    switch (this.state) {
      case STATE.TOUCH_ROTATE:
        if (this.enableRotate === false) return

        this.handleTouchMoveRotate(event)
        this.update()
        break

      case STATE.TOUCH_PAN:
        if (this.enablePan === false) return

        this.handleTouchMovePan(event)
        this.update()
        break

      case STATE.TOUCH_DOLLY_PAN:
        if (this.enableZoom === false && this.enablePan === false) return

        this.handleTouchMoveDollyPan(event)
        this.update()
        break

      case STATE.TOUCH_DOLLY_ROTATE:
        if (this.enableZoom === false && this.enableRotate === false) return

        this.handleTouchMoveDollyRotate(event)
        this.update()
        break

      default:
        this.state = STATE.NONE
    }
  }

  onContextMenu(event: Event) {
    if (this.enabled === false) return
    event.preventDefault()
  }

  addPointer(event: PointerEvent) {
    this.pointers.push(event)
  }

  removePointer(event: PointerEvent) {
    delete this.pointerPositions[event.pointerId]
    for (let i = 0; i < this.pointers.length; i++) {
      if (this.pointers[i].pointerId == event.pointerId) {
        this.pointers.splice(i, 1)
        return
      }
    }
  }

  trackPointer(event: PointerEvent) {
    let position = this.pointerPositions[event.pointerId]

    if (position === undefined) {
      position = new Vector2()
      this.pointerPositions[event.pointerId] = position
    }

    position.set(event.pageX, event.pageY)
  }

  getSecondPointerPosition(event: PointerEvent) {
    const pointer =
      event.pointerId === this.pointers[0].pointerId
        ? this.pointers[1]
        : this.pointers[0]

    return this.pointerPositions[pointer.pointerId]
  }
}
