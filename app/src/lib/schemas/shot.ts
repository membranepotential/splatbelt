import { z } from 'zod'
import { Vector2, Vector3 } from 'three'

export const Movement = z.enum(['dolly', 'zoom', 'pan', 'orbit'])

export type Movement = z.infer<typeof Movement>

export const Motion = z.object({
  movement: Movement,
  scale: z.coerce.number(),
})

export type Motion = z.infer<typeof Motion>

const ZodVector2 = z
  .tuple([z.number(), z.number()])
  .transform(([x, y]) => new Vector2(x, y))

const ZodVector3 = z
  .tuple([z.number(), z.number(), z.number()])
  .transform(([x, y, z]) => new Vector3(x, y, z))

export const Shot = z.object({
  duration: z.coerce.number().positive().default(12000),
  motion: z.object({ x: Motion, y: Motion }),
  initial: z.object({
    camera: z.object({ position: ZodVector3, zoom: z.number() }),
    target: ZodVector3,
  }),
  points: z.array(ZodVector2),
})

export type Shot = z.infer<typeof Shot>

export const DEFAULT_SCALES: Record<
  Movement,
  {
    x: number
    y: number
  }
> = {
  dolly: { x: 0.1, y: 0.1 },
  zoom: { x: 0.01, y: 0.01 },
  pan: { x: 2, y: 0.05 },
  orbit: { x: 0.01, y: 0.003 },
}
