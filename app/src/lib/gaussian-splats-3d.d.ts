declare module 'gaussian-splats-3d' {
  import type {
    Scene,
    Renderer,
    PerspectiveCamera,
    Vector3,
    EventDispatcher,
  } from 'three'

  type ViewerOptions = {
    rootElement?: HTMLElement

    initialCameraPosition?: [number, number, number]
    initialCameraLookAt?: [number, number, number]
    cameraUp?: [number, number, number]

    scene?: Scene
    renderer?: Renderer
    camera?: PerspectiveCamera

    selfDrivenMode?: boolean
    useBuiltInControls?: boolean
    ignoreDevicePixelRatio?: boolean
    gpuAcceleratedSort?: boolean
    halfPrecisionCovariancesOnGPU?: boolean
    dropInMode?: boolean
  }

  type ViewerLoadFileOptions = {
    splatAlphaRemovalThreshold?: number

    position?: [number, number, number]
    rotation?: [number, number, number, number]
    scale?: [number, number, number]

    showLoadingSpinner?: boolean
    onProgress?: (progress: number, msg: string, stage: string) => void
  }

  declare class Viewer {
    camera: PerspectiveCamera
    scene: Scene
    renderer: Renderer
    controls: OrbitControls

    cameraUp: Vector3
    initialCameraPosition: Vector3
    initialCameraLookAt: Vector3

    dropInMode: boolean
    selfDrivenMode: boolean
    useBuiltInControls: boolean
    rootElement: HTMLElement
    ignoreDevicePixelRatio: boolean
    halfPrecisionCovariancesOnGPU: boolean
    gpuAcceleratedSort: boolean

    showMeshCursor: boolean
    showControlPlane: boolean
    showInfo: boolean

    currentFPS: number
    lastSortTime: number

    constructor(options?: ViewerOptions)
    loadFile(file: string, options?: ViewerLoadFileOptions): Promise<void>
    start(): void
    stop(): void
  }

  declare class OrbitControls extends EventDispatcher {
    // The camera to be controlled
    object: PerspectiveCamera

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

    constructor(object: PerspectiveCamera, domElement: HTMLElement)

    getPolarAngle(): number
    getAzimuthalAngle(): number
    getDistance(): number

    listenToKeyEvents(domElement: HTMLElement): void
    stopListenToKeyEvents(): void

    saveState(): void
    reset(): void

    dispose(): void
  }
}
