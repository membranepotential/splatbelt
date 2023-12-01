import { z } from 'zod'

import { FrameConfig } from './frameConfig'
import { PairingConfig } from './pairingConfig'
import { MatchingConfig } from './matchingConfig'

export const ModelConfig = z.object({
  frames: z.record(FrameConfig),
  pairing: PairingConfig,
  matching: MatchingConfig,
  minMatchScore: z.coerce.number().optional(),
  numIter: z.coerce.number().int().default(7000),
})

export type ModelConfig = z.infer<typeof ModelConfig>
