import { z } from 'zod'
import { AnalysisState } from '$lib/enums'

export const modelConfig = z.object({
  frames: z.record(
    z.union([
      z.object({
        type: z.literal('num'),
        num: z.coerce.number(),
      }),
      z.object({
        type: z.literal('list'),
        frames: z.array(z.coerce.number()),
      }),
    ])
  ),
  pairing: z.union([
    z.object({
      type: z.literal('exhaustive'),
    }),
    z.object({
      type: z.literal('complex'),
      sequential: z.coerce.number().default(10),
      retrieval: z.coerce.number().default(0),
      covisible: z
        .object({
          num: z.coerce.number(),
          model: z.string(),
        })
        .optional(),
    }),
  ]),
  features: z.string(),
  matcher: z.string(),
  numIter: z.coerce.number(),
})

export const project = z.object({
  name: z.string().optional(),
  state: z.nativeEnum(AnalysisState).optional(),
  config: modelConfig.optional(),
})
