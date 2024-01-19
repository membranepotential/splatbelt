import type { Vector3, Vector2 } from 'three'

export enum VIEWER_STATE {
  FREE = 'FREE',
  RECORD = 'RECORD',
  PLAY = 'PLAY',
  EXPORT = 'EXPORT',
}

export enum Movement {
  DOLLY = 'DOLLY',
  ZOOM = 'ZOOM',
  PAN = 'PAN',
  ROTATE = 'ROTATE',
}

export type CameraSetting = {
  position: Vector3
  target: Vector3
  zoom: number
}

export type Sample = {
  timeStamp: number
  pointer: Vector2
  camera: CameraSetting
}

export type Shot = {
  motion: { x: Movement; y: Movement }
  speed: number
  samples: Sample[]
}

export const DEFAULT_SHOT = {
  motion: { x: Movement.ROTATE, y: Movement.ROTATE },
  speed: 1,
  samples: [],
}
