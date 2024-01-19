import { ulid } from 'ulid'
import type { PageServerLoad, Actions } from './$types'
import { list, create } from '$lib/server/projects'
import * as uploads from '$lib/server/uploads'
import { fail } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
  return { projects: await list() }
}

export const actions = {
  prepare: async ({ request }) => {
    try {
      const id = ulid().toLowerCase()

      const formData = await request.formData()
      const name = formData.get('name') as string
      const size = parseInt(formData.get('size') as string)
      const type = formData.get('type') as string

      const upload = await uploads.create(id, { name, type, size })

      return { id, ...upload }
    } catch (error) {
      return fail(422, { message: error.message })
    }
  },
  complete: async ({ request }) => {
    try {
      const formData = await request.formData()
      const id = formData.get('id') as string
      const name = formData.get('name') as string
      const key = formData.get('key') as string
      const uploadId = formData.get('uploadId') as string
      const etags = formData.getAll('etags') as Array<string>

      await uploads.complete({ key, uploadId, etags })
      await create(id, name)
    } catch (error) {
      return fail(422, { message: error.message })
    }
  },
} satisfies Actions
