import { fail } from '@sveltejs/kit'
import { z } from 'zod'
import { parseForm } from '$lib/server/form'
import type { Actions } from './$types'

import * as uploads from '$lib/server/uploads'
import type { PageServerLoad } from '../$types'

export const load: PageServerLoad = ({ params }) => {
  return { uploads: uploads.listWithType(params.id) }
}

export const actions = {
  prepare: async ({ params, request }) => {
    try {
      const file = parseForm(
        await request.formData(),
        z.object({
          name: z.string(),
          size: z.number().int().positive(),
          type: z.string().regex(/^(image|video)\/.+$/),
        })
      )
      return await uploads.create(params.id, file)
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
  complete: async ({ request }) => {
    try {
      const upload = parseForm(
        await request.formData(),
        z.object({
          key: z.string(),
          uploadId: z.string(),
          etags: z.array(z.string()),
        })
      )

      await uploads.complete(upload)
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
} satisfies Actions
