import { Vector2, Vector3, PerspectiveCamera } from 'three'
import { type Movement, DEFAULT_SCALES } from '$lib/schemas/shot'
import { derived } from 'svelte/store'
import controls from '$lib/stores/controls'

export type CameraSetting = {
  camera: PerspectiveCamera
  target: Vector3
}

type MotionFn = (state: CameraSetting, delta: number) => CameraSetting

function dolly(state: CameraSetting, delta: number) {
  const camera = state.camera.translateZ(delta)
  return { ...state, camera }
}

function zoom(state: CameraSetting, delta: number) {
  const camera = state.camera.clone()
  camera.zoom = Math.min(Math.max(camera.zoom - delta, 0.0), 30)
  return { ...state, camera }
}

function panX(state: CameraSetting, delta: number) {
  const camera = state.camera.clone().translateX(delta)
  const target = camera.position
    .clone()
    .sub(state.camera.position)
    .add(state.target)
  return { ...state, camera, target }
}

function panY(state: CameraSetting, delta: number) {
  const camera = state.camera.clone().translateY(delta)
  const target = camera.position
    .clone()
    .sub(state.camera.position)
    .add(state.target)
  return { ...state, camera, target }
}

function orbitX(state: CameraSetting, delta: number) {
  const r = state.camera.position.distanceTo(state.target)
  let camera = state.camera.clone()
  camera = camera.translateZ(-r)
  camera = camera.rotateOnWorldAxis(state.camera.up, -delta)
  camera = camera.translateZ(r)
  return { ...state, camera }
}

function orbitY(state: CameraSetting, delta: number) {
  const r = state.camera.position.distanceTo(state.target)
  const forward = state.camera.getWorldDirection(new Vector3())
  const angle = Math.PI - state.camera.up.angleTo(forward)
  const right = forward.cross(state.camera.up).normalize()

  let camera = state.camera.clone()
  camera = camera.translateZ(-r)
  camera = camera.rotateOnWorldAxis(right, -Math.min(delta, angle - 0.001))
  camera = camera.translateZ(r)

  return { ...state, camera }
}

const motions = {
  dolly: { x: dolly, y: dolly },
  zoom: { x: zoom, y: zoom },
  pan: { x: panX, y: panY },
  orbit: { x: orbitX, y: orbitY },
}

export function composeMotion(
  x: { motion: MotionFn; scale: number },
  y: { motion: MotionFn; scale: number }
) {
  return (state: CameraSetting, delta: Vector2) => {
    state = x.motion(state, delta.x * x.scale)
    state = y.motion(state, delta.y * y.scale)
    return state
  }
}

export function getMovementConfig(
  movement: Movement,
  axis: 'x' | 'y'
): { motion: MotionFn; scale: number } {
  return {
    motion: motions[movement][axis],
    scale: DEFAULT_SCALES[movement][axis],
  }
}

export const composedMotion = derived(controls, ($controls) => {
  return composeMotion(
    getMovementConfig($controls.x, 'x'),
    getMovementConfig($controls.y, 'y')
  )
})
