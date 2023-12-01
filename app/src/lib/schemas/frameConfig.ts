import { z } from 'zod'

export const FrameConfig = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('num'),
      num: z.coerce.number(),
    }),
    z.object({
      type: z.literal('list'),
      frames: z.array(z.coerce.number()),
    }),
  ])
  .default({ type: 'num', num: 100 })

export type FrameConfig = z.infer<typeof FrameConfig>
export type FrameSelectionType = FrameConfig['type']
