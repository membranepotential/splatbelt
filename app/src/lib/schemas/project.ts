import { z } from 'zod'
import { ModelConfig } from './modelConfig'
import type { Shot } from '$lib/types'

export const AnalysisState = z.enum([
  'configuring',
  'pending',
  'running',
  'complete',
  'failed',
])

export type AnalysisState = z.infer<typeof AnalysisState>

export const LogEntry = z.object({
  time: z.coerce.date(),
  message: z.string(),
})
export type LogEntry = z.infer<typeof LogEntry>

export const Project = z.object({
  id: z.coerce.number(),
  name: z.string(),
  created: z.coerce.date(),
  updated: z.coerce.date(),
  state: AnalysisState.default('configuring'),
  shots: z.array(z.object({})).default([]),
  config: ModelConfig,
  logs: z.array(LogEntry).default([]),
})

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

export const ProjectUpdate = Project.pick({
  name: true,
  state: true,
  shots: true,
  config: true,
}).partial()

export type ProjectUpdate = z.infer<typeof ProjectUpdate>
