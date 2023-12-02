import type { Viewer } from '$splats'
import * as TWEEN from '@tweenjs/tween.js'

import type { PerspectiveCamera, Vector3 } from 'three'

class CameraService {
  viewer: Viewer | null

  tween2state: string
  tween: TWEEN.Tween<Vector3>

  constructor() {
    console.log('CameraService')
    this.viewer = null
    this.tween2state = 'inactive'
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

  test2() {
    // return this.viewer?.controls.rotateLeft(0.1)

    const camera: PerspectiveCamera = this.viewer?.camera

    const coords = {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    }
    // console.log(coords)
    // camera.position.set(coords.x + 100, coords.y, coords.z)

    if (this.tween2state === 'inactive') {
      this.tween = new TWEEN.Tween(coords)
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
        .onComplete(() => {
          this.tween2state = 'not-started'
        })
    }

    if (this.tween2state === 'inactive') {
      console.log('tween starting')
      this.tween.start()
      this.tween2state = 'active'
    } else if (this.tween2state === 'active') {
      console.log('tween pausing')
      this.tween.stop()
      this.tween2state = 'inactive'
    }
  }
}

const _CameraService = new CameraService()
export default _CameraService
