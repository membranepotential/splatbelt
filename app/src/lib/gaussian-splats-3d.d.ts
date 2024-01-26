declare module '@mkkellogg/gaussian-splats-3d' {
  import type { Scene, Renderer, PerspectiveCamera, Vector3 } from 'three'

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
    splatMesh: Scene
    threeScene: Scene
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
    devicePixelRatio: number
    halfPrecisionCovariancesOnGPU: boolean
    gpuAcceleratedSort: boolean
    integerBasedSort: boolean
    sharedMemoryForWorkers: boolean

    showMeshCursor: boolean
    showControlPlane: boolean
    showInfo: boolean

    selfDrivenModeRunning: boolean
    splatRenderingInitialized: boolean

    raycaster: Raycaster

    currentFPS: number
    lastSortTime: number

    previousCameraTarget: Vector3
    nextCameraTarget: Vector3

    resizeObserver: ResizeObserver

    usingExternalCamera: boolean
    usingExternalRenderer: boolean

    constructor(options?: ViewerOptions)
    addSplatScene(file: string, options?: ViewerLoadFileOptions): Promise<void>
    start(): void
    stop(): void
    update(): void
    render(): void
    dispose(): void
  }
}
