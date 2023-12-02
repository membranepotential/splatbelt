import { get } from 'svelte/store'
import { app, controls } from '$lib/stores'
import type { Viewer } from '$splats'
import { throttle } from 'lodash-es'
import * as TWEEN from '@tweenjs/tween.js'
import type { PerspectiveCamera } from 'three'
import { VIEWER_STATE } from '$lib/types'
import { Spherical, Vector3 } from 'three'

class RenderService {
  viewer: Viewer | null

  constructor() {
    this.viewer = null
  }

  link(viewer: Viewer) {
    this.viewer = viewer
  }
}

const service = new RenderService()
export default service
