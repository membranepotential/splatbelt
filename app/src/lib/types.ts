import type { Vector3 } from 'three'

export enum VIEWER_STATE {
  FREE = 'FREE',
  RECORD = 'RECORD',
  PLAY = 'PLAY',
}

export type Shot = {
  id: number
  duration: number
  initialPosition: {
    target: Vector3
    position: Vector3
    zoom: number
  }
  newCameraPosition: MotionDestination | null
}

export enum CAMERA_RECORDING_MODE {
  DOLLY = 'DOLLY',
  ZOOM = 'ZOOM',
  PAN = 'PAN',
}

export type XYZ = {
  x: number
  y: number
  z: number
}

export type MotionDestination = {
  coords: XYZ
  zoom: number
  hasAppliedDolly: boolean
  hasAppliedZoom: boolean
  hasAppliedPan: boolean
}
