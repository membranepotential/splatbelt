import type { Viewer } from '$lib/splats'
import * as TWEEN from '@tweenjs/tween.js'

import type { PerspectiveCamera } from 'three'

class CameraService {
  viewer: Viewer | null

  constructor() {
    console.log('CameraService')
    this.viewer = null
  }

  link(viewer: Viewer) {
    this.viewer = viewer
  }

  test() {
    // return this.viewer?.controls.rotateLeft(0.1)
    const camera: PerspectiveCamera = this.viewer?.camera

    const coords = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    // console.log(coords)
    // camera.position.set(coords.x + 100, coords.y, coords.z)
    new TWEEN.Tween(coords)
      .to(
        {
          x: camera.position.x,

          y: camera.position.y - 100,
          z: camera.position.z,
        },
        5000
      )
      .onUpdate(() => {
        console.log('calling update')
        camera.position.set(coords.x, coords.y, coords.z)
      })
      .start()
  }
}

const _CameraService = new CameraService()
export default _CameraService
