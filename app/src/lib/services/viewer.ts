import { Viewer as _Viewer } from 'gaussian-splats-3d'
import { EventDispatcher, type PerspectiveCamera, type Vector3 } from 'three'

type ViewerOptions = {
  position: [number, number, number]
  LookAt?: [number, number, number]
  up?: [number, number, number]
  minAlpha?: number
}

/* This should be refactored as a reactive component */
export default class Viewer extends EventDispatcher<{
  ready: {}
  moved: { camera: PerspectiveCamera; target: Vector3 }
}> {
  viewer: _Viewer
  options: ViewerOptions

  constructor(rootElement: HTMLElement, options: ViewerOptions) {
    super()

    this.options = options
    this.viewer = new _Viewer({
      rootElement,
      initialCameraPosition: options.position,
      initialCameraLookAt: options.LookAt || [0, 0, 0],
      cameraUp: options.up || [0, 1, 0],
    })
    this.viewer.controls.minPolarAngle = -Math.PI / 2
    this.viewer.controls.maxPolarAngle = Math.PI / 2
  }

  async loadFile(url: string) {
    await this.viewer.loadFile(url, {
      splatAlphaRemovalThreshold: this.options.minAlpha,
    })
    this.viewer.start()

    this.dispatchEvent({ type: 'ready' })
  }

  get rootElement() {
    return this.viewer.rootElement
  }

  set rootElement(element: HTMLElement) {
    this.viewer.rootElement = element
  }

  get camera() {
    return this.viewer.camera
  }

  get controls() {
    return this.viewer.controls
  }

  get target() {
    return this.controls.target
  }

  destroy() {
    this.viewer.stop()
    this.viewer.controls.dispose()
  }

  moveTo(to: { camera: PerspectiveCamera; target: Vector3 }) {
    this.camera.copy(to.camera)
    this.target.copy(to.target)

    this.dispatchEvent({ type: 'moved', ...to })
  }

  saveState() {
    this.controls.saveState()
    return {
      camera: this.camera.clone(),
      target: this.target.clone(),
    }
  }

  reset() {
    this.controls.reset()

    this.dispatchEvent({
      type: 'moved',
      camera: this.camera,
      target: this.target,
    })
  }
}
