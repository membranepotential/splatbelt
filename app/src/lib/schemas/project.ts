import type { Shot } from '$lib/types'

export enum AnalysisState {
  CONFIGURING = 'CONFIGURING',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

type CameraSetting = {
  position: [number, number, number]
  up: [number, number, number]
  center: [number, number, number]
  fov: number
}

export type LogEntry = {
  time: Date
  message: string
}

export type Project = {
  id: number
  name: string
  created: Date
  updated: Date
  state: AnalysisState
  camera?: CameraSetting
  shots: Shot[]
}

export type ProjectUpdate = Partial<Pick<Project, 'name' | 'state' | 'shots'>>
