// import rotation type from threejs
import type { Writable } from 'svelte/store'
import type { Vector3 } from 'three'

export enum VIEWER_STATE {
  FREE = 'FREE',
  RECORD = 'RECORD',
  PLAY = 'PLAY',
}

export type Interaction = {
  timeStamp: number
  x: number
  y: number
}

export type Shot = {
  trace: Interaction[]
  initialPosition: {
    target: Vector3
    position: Vector3
    zoom: number
  }
}

export enum CAMERA_RECORDING_MODE {
  DOLLY = 'DOLLY',
  ZOOM = 'ZOOM',
  PAN = 'PAN',
}
