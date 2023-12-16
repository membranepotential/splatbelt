import { ModelConfig } from './modelConfig'
import type { Shot } from '$lib/types'

export enum AnalysisState {
  CONFIGURING = 'CONFIGURING',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
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
  shots: Shot[]
  config: ModelConfig
  logs: LogEntry[]
}

export type ProjectUpdate = Partial<
  Pick<Project, 'name' | 'state' | 'shots' | 'config'>
>
