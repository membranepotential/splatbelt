// import rotation type from threejs
import type { Vector3 } from 'three'

export enum VIEWER_STATE {
  FREE = 'FREE',
  RECORD = 'RECORD',
  PLAY = 'PLAY',
}

export type Shot = {
  events: Event[]
  initialPosition: {
    target: Vector3
    position: Vector3
    zoom: number
  }
}
