import { z } from 'zod'
import { ModelConfig } from './modelConfig'

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
  name: z.string().default('New Project'),
  created: z.coerce.date(),
  updated: z.coerce.date(),
  state: AnalysisState.default('configuring'),
  config: ModelConfig,
  logs: z.array(LogEntry).default([]),
})

export type Project = z.infer<typeof Project>

export const ProjectUpdate = Project.pick({
  name: true,
  state: true,
  config: true,
}).partial()

export type ProjectUpdate = z.infer<typeof ProjectUpdate>
