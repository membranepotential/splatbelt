import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import * as projects from '$lib/server/projects'

/**
 * Redirect users from [id]/ to [id]/edit
 */
export const load: PageServerLoad = ({ url }) => {
  const pathname = url.pathname
  throw redirect(302, `${pathname}/edit`)
}

export const actions = {
  rename: async ({ params, request }) => {
    try {
      const data = await request.formData()
      const name = data.get('value')?.toString().trim()
      if (!name) {
        throw { message: 'Name cannot be empty' }
      }

      await projects.update(params.id, { name })
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
  updateConfig: async ({ params, request }) => {
    try {
      const config = await request.json()
      // console.log('updateConfig', config)
      await projects.update(params.id, { config })
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
  analyse: async ({ params }) => {
    await projects.update(params.id, { state: "pending" })
  },
  delete: async ({ params }) => {
    try {
      await projects.delete_(params.id)
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
} satisfies Actions
