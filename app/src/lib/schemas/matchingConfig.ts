import { z } from 'zod'

export const MatchingConfig = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('lightglue'),
      features: z.enum(['superpoint', 'disk']),
    }),
    z.object({
      type: z.literal('superglue'),
      features: z.enum(['superpoint', 'disk']),
      weights: z.enum(['indoor', 'outdoor']),
      iterations: z.coerce.number().nonnegative(),
    }),
    z.object({
      type: z.literal('colmap'),
      features: z.enum(['superpoint', 'disk', 'colmap']),
    }),
  ])
  .default({ type: 'colmap', features: 'colmap' })

export type MatchingConfig = z.infer<typeof MatchingConfig>
export type MatchingType = MatchingConfig['type']
export type FeatureType = MatchingConfig['features']
