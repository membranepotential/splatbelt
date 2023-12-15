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
  ORBIT = 'ORBIT',
}

export type Shot = {
  duration: number
  motion: { x: Motion; y: Motion }
  initial: {
    camera: { position: Vector3; zoom: number }
    target: Vector3
  }
  points: Vector2[]
}

export type Motion = {
  movement: Movement
  scale: number
}
