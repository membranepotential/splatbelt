import { z } from 'zod'

export const PairingConfig = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('exhaustive') }),
    z.object({
      type: z.literal('complex'),
      sequential: z.coerce.number().nonnegative(),
      retrieval: z.coerce.number().nonnegative(),
    }),
  ])
  .default({ type: 'exhaustive' })

export type PairingConfig = z.infer<typeof PairingConfig>
export type PairingType = PairingConfig['type']
